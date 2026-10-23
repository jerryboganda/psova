// Centres network service (docs/centres/PLAN.md). Server-only. Application,
// admin approval and manual-payment verification. Centre membership state is
// computed from `membershipExpiresAt` (lib/registry/membership.ts).

import type { Prisma } from '@prisma/client';
import { auth } from './auth';
import { prisma } from './db';
import { blindIndex, decryptField, encryptField } from './crypto';
import { writeAudit } from './audit';
import { AuditAction, MEMBERSHIP_FEE_PKR } from './constants';
import { RegistryApiError } from './guards';
import { addDays, membershipState, renewedPeriod, type MembershipState } from './membership';
import {
  sendCenterApplicationReceived,
  sendCenterApproved,
  sendCenterPaymentResult,
} from './mailer';
import type {
  AdminCenterPaymentsQuery,
  AdminCentersQuery,
  CenterActionInput,
  CenterApplyInput,
  CenterPaymentActionInput,
  CenterPaymentProofInput,
} from './schemas';

const PAGE_SIZE = 20;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'centre'
  );
}

async function uniqueSlug(name: string, city: string): Promise<string> {
  const base = slugify(`${name} ${city}`);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await prisma.center.findUnique({ where: { slug: candidate }, select: { id: true } }))) {
      return candidate;
    }
  }
  return `${base}-${Date.now().toString(36)}`;
}

/* -------------------------------------------------------------------------- */
/*  Public: application                                                       */
/* -------------------------------------------------------------------------- */

export async function applyCenter(
  data: CenterApplyInput,
  ctx: { headers: Headers; ip: string },
): Promise<void> {
  // Create the auth user (role defaults to 'clinician'; promoted to 'center' below).
  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      body: { name: data.ownerName, email: data.email, password: data.password },
      headers: ctx.headers,
    });
    userId = result.user.id;
  } catch {
    // Generic error — do not reveal whether the email already exists.
    throw new RegistryApiError(400, 'validation');
  }

  const headDoctorHash = blindIndex(data.headDoctorPmc, 'pmc');
  const duplicate = await prisma.center.findFirst({ where: { headDoctorHash }, select: { id: true } });
  const slug = await uniqueSlug(data.nameEn, data.city);

  let centerId: string;
  try {
    const center = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role: 'center' } });
      return tx.center.create({
        data: {
          slug,
          nameEn: data.nameEn,
          nameUr: data.nameUr || null,
          type: data.type,
          city: data.city,
          province: data.province,
          address: data.address,
          phone: data.phone,
          email: data.contactEmail,
          website: data.websiteUrl || null,
          services: data.services,
          conditions: data.conditions,
          licenceNumber: data.licenceNumber,
          headDoctorName: data.headDoctorName,
          headDoctorPmc: encryptField(data.headDoctorPmc),
          headDoctorHash,
          members: { create: { userId, role: 'OWNER' } },
          ...(data.payment ? { payments: { create: paymentCreateData(data.payment) } } : {}),
        },
      });
    });
    centerId = center.id;
  } catch (e) {
    // Roll back the orphaned user so a retry can succeed cleanly.
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    throw e;
  }

  await writeAudit({
    actorId: userId,
    actorRole: 'center',
    action: AuditAction.CENTER_APPLY,
    entity: 'Center',
    entityId: centerId,
    meta: {
      province: data.province,
      type: data.type,
      withPayment: Boolean(data.payment),
      ...(duplicate ? { possibleDuplicatePmc: true } : {}),
    },
    ip: ctx.ip,
  });
  void sendCenterApplicationReceived(data.email, data.nameEn);
}

function paymentCreateData(p: CenterPaymentProofInput) {
  return {
    amount: MEMBERSHIP_FEE_PKR,
    method: p.method,
    txnRef: p.txnRef,
    paidOn: new Date(`${p.paidOn}T00:00:00.000Z`),
  };
}

/** Renewal / late payment proof from the centre dashboard. */
export async function submitCenterPayment(
  centerId: string,
  proof: CenterPaymentProofInput,
  ctx: { actorId: string; ip: string | null },
): Promise<void> {
  const payment = await prisma.centerPayment.create({
    data: { centerId, ...paymentCreateData(proof) },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_PAYMENT_SUBMIT,
    entity: 'CenterPayment',
    entityId: payment.id,
    meta: { method: proof.method },
    ip: ctx.ip,
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin: centres queue                                                      */
/* -------------------------------------------------------------------------- */

export type CenterRow = {
  id: string;
  slug: string;
  nameEn: string;
  type: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  licenceNumber: string;
  headDoctorName: string;
  headDoctorPmc: string;
  ownerName: string | null;
  ownerEmail: string | null;
  status: string;
  tier: string;
  statusReason: string | null;
  membershipExpiresAt: string | null;
  membership: MembershipState;
  pendingPayments: number;
  createdAt: string;
};

/** Decrypts each head-doctor PMC number (PII) — the route audits the view. */
export async function listCenters(
  query: AdminCentersQuery,
): Promise<{ items: CenterRow[]; page: number; pageSize: number; total: number }> {
  const where: Prisma.CenterWhereInput = query.status ? { status: query.status } : {};
  const [rows, total] = await Promise.all([
    prisma.center.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        members: { where: { role: 'OWNER' }, take: 1, include: { user: { select: { name: true, email: true } } } },
        _count: { select: { payments: { where: { status: 'PENDING' } } } },
      },
    }),
    prisma.center.count({ where }),
  ]);

  return {
    items: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      type: c.type,
      city: c.city,
      province: c.province,
      phone: c.phone,
      email: c.email,
      licenceNumber: c.licenceNumber,
      headDoctorName: c.headDoctorName,
      headDoctorPmc: decryptField(c.headDoctorPmc),
      ownerName: c.members[0]?.user.name ?? null,
      ownerEmail: c.members[0]?.user.email ?? null,
      status: c.status,
      tier: c.tier,
      statusReason: c.statusReason,
      membershipExpiresAt: c.membershipExpiresAt?.toISOString() ?? null,
      membership: membershipState(c.membershipExpiresAt),
      pendingPayments: c._count.payments,
      createdAt: c.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
  };
}

export async function setCenterAction(
  id: string,
  action: CenterActionInput,
  ctx: { adminId: string; ip: string | null },
): Promise<void> {
  const center = await prisma.center.findUnique({
    where: { id },
    include: { members: { where: { role: 'OWNER' }, take: 1, include: { user: { select: { email: true } } } } },
  });
  if (!center) throw new RegistryApiError(404, 'not-found');
  const ownerEmail = center.members[0]?.user.email;
  const audit = (act: keyof typeof AuditAction, meta?: Prisma.InputJsonValue) =>
    writeAudit({
      actorId: ctx.adminId,
      actorRole: 'admin',
      action: AuditAction[act],
      entity: 'Center',
      entityId: id,
      meta: meta ?? { province: center.province },
      ip: ctx.ip,
    });
  const invalid = () => new RegistryApiError(409, 'invalid-transition');

  switch (action.action) {
    case 'APPROVE': {
      if (center.status !== 'APPLIED' && center.status !== 'REJECTED') throw invalid();
      await prisma.center.update({
        where: { id },
        data: {
          status: 'APPROVED',
          statusReason: null,
          approvedAt: new Date(),
          approvedById: ctx.adminId,
          ...(action.tier ? { tier: action.tier } : {}),
          ...(action.lat !== undefined ? { lat: action.lat } : {}),
          ...(action.lng !== undefined ? { lng: action.lng } : {}),
        },
      });
      await audit('CENTER_APPROVE');
      if (ownerEmail) void sendCenterApproved(ownerEmail, center.nameEn);
      return;
    }
    case 'REJECT': {
      if (center.status !== 'APPLIED') throw invalid();
      await prisma.center.update({ where: { id }, data: { status: 'REJECTED', statusReason: action.reason } });
      await audit('CENTER_REJECT');
      return;
    }
    case 'SUSPEND': {
      if (center.status !== 'APPROVED') throw invalid();
      await prisma.center.update({ where: { id }, data: { status: 'SUSPENDED', statusReason: action.reason } });
      await audit('CENTER_SUSPEND');
      return;
    }
    case 'REINSTATE': {
      if (center.status !== 'SUSPENDED') throw invalid();
      await prisma.center.update({ where: { id }, data: { status: 'APPROVED', statusReason: null } });
      await audit('CENTER_REINSTATE');
      return;
    }
    case 'SET_TIER': {
      if (center.status !== 'APPROVED') throw invalid();
      await prisma.center.update({ where: { id }, data: { tier: action.tier } });
      await audit('CENTER_TIER', { tier: action.tier });
      return;
    }
    case 'EXTEND': {
      if (center.status !== 'APPROVED') throw invalid();
      const now = new Date();
      const base = center.membershipExpiresAt && center.membershipExpiresAt > now ? center.membershipExpiresAt : now;
      await prisma.center.update({ where: { id }, data: { membershipExpiresAt: addDays(base, action.days) } });
      await audit('CENTER_EXTEND', { days: action.days });
      return;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin: payments to verify                                                 */
/* -------------------------------------------------------------------------- */

export type CenterPaymentRow = {
  id: string;
  centerId: string;
  centerName: string;
  city: string;
  amount: number;
  method: string;
  txnRef: string;
  paidOn: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
};

export async function listCenterPayments(
  query: AdminCenterPaymentsQuery,
): Promise<{ items: CenterPaymentRow[]; page: number; pageSize: number; total: number }> {
  const where: Prisma.CenterPaymentWhereInput = query.status ? { status: query.status } : {};
  const [rows, total] = await Promise.all([
    prisma.centerPayment.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // oldest first — it is a work queue
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { center: { select: { nameEn: true, city: true } } },
    }),
    prisma.centerPayment.count({ where }),
  ]);
  return {
    items: rows.map((p) => ({
      id: p.id,
      centerId: p.centerId,
      centerName: p.center.nameEn,
      city: p.center.city,
      amount: p.amount,
      method: p.method,
      txnRef: p.txnRef,
      paidOn: p.paidOn.toISOString(),
      status: p.status,
      rejectReason: p.rejectReason,
      createdAt: p.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
  };
}

export async function setCenterPaymentAction(
  id: string,
  action: CenterPaymentActionInput,
  ctx: { adminId: string; ip: string | null },
): Promise<void> {
  const payment = await prisma.centerPayment.findUnique({
    where: { id },
    include: {
      center: {
        include: { members: { where: { role: 'OWNER' }, take: 1, include: { user: { select: { email: true } } } } },
      },
    },
  });
  if (!payment) throw new RegistryApiError(404, 'not-found');
  if (payment.status !== 'PENDING') throw new RegistryApiError(409, 'invalid-transition');
  const ownerEmail = payment.center.members[0]?.user.email;
  const now = new Date();

  if (action.action === 'VERIFY') {
    const { start, end } = renewedPeriod(payment.center.membershipExpiresAt, now);
    // updateMany guards against two admins verifying the same payment at once.
    const claimed = await prisma.$transaction(async (tx) => {
      const res = await tx.centerPayment.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'VERIFIED', verifiedAt: now, verifiedById: ctx.adminId, periodStart: start, periodEnd: end },
      });
      if (res.count === 0) return false;
      await tx.center.update({ where: { id: payment.centerId }, data: { membershipExpiresAt: end } });
      return true;
    });
    if (!claimed) throw new RegistryApiError(409, 'invalid-transition');
    await writeAudit({
      actorId: ctx.adminId,
      actorRole: 'admin',
      action: AuditAction.CENTER_PAYMENT_VERIFY,
      entity: 'CenterPayment',
      entityId: id,
      meta: { method: payment.method, periodEnd: end.toISOString().slice(0, 10) },
      ip: ctx.ip,
    });
    if (ownerEmail) {
      void sendCenterPaymentResult(ownerEmail, payment.center.nameEn, true, end.toISOString().slice(0, 10));
    }
    return;
  }

  const res = await prisma.centerPayment.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', rejectReason: action.reason, verifiedAt: now, verifiedById: ctx.adminId },
  });
  if (res.count === 0) throw new RegistryApiError(409, 'invalid-transition');
  await writeAudit({
    actorId: ctx.adminId,
    actorRole: 'admin',
    action: AuditAction.CENTER_PAYMENT_REJECT,
    entity: 'CenterPayment',
    entityId: id,
    meta: { method: payment.method },
    ip: ctx.ip,
  });
  if (ownerEmail) void sendCenterPaymentResult(ownerEmail, payment.center.nameEn, false);
}
