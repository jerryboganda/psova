// Patient support fund (docs/centres/PLAN.md). A centre asks PSOVA to raise money for one patient's
// treatment; PSOVA reviews it, publishes an anonymised blurb, and records funding by hand as donations
// arrive (bank / wallet transfers quoting the request's code). The patient is never named publicly and
// is never linked to a public row — publicly we show only treatment, cost, blurb, progress and the centre.

import { randomBytes } from 'node:crypto';
import type { Center, Prisma } from '@prisma/client';
import { prisma } from './db';
import { writeAudit } from './audit';
import { AuditAction } from './constants';
import { RegistryApiError } from './guards';
import type { SupportRequestCreateInput, SupportReviewInput } from './schemas';

type Ctx = { actorId: string; ip: string | null };
const PAGE_SIZE = 20;

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = `SF-${randomBytes(4).toString('hex').toUpperCase()}`;
    if (!(await prisma.supportRequest.findUnique({ where: { publicCode: code }, select: { id: true } }))) return code;
  }
  throw new RegistryApiError(500, 'server-error');
}

/* -------------------------------------------------------------------------- */
/*  Centre side                                                               */
/* -------------------------------------------------------------------------- */

export async function createSupportRequest(
  center: Center,
  input: SupportRequestCreateInput,
  ctx: Ctx,
): Promise<string> {
  const own = await prisma.registryPatient.findFirst({ where: { id: input.patientId, centerId: center.id }, select: { id: true } });
  if (!own) throw new RegistryApiError(404, 'not-found');
  // One live request per patient: finish or close it before asking again.
  const open = await prisma.supportRequest.findFirst({
    where: { patientId: input.patientId, status: { in: ['SUBMITTED', 'APPROVED'] } },
    select: { id: true },
  });
  if (open) throw new RegistryApiError(409, 'conflict');

  const req = await prisma.supportRequest.create({
    data: {
      publicCode: await uniqueCode(),
      patientId: input.patientId,
      centerId: center.id,
      treatment: input.treatment,
      estimatedCostPkr: input.estimatedCostPkr,
      blurbEn: input.blurbEn,
      blurbUr: input.blurbUr || null,
      createdById: ctx.actorId,
    },
    select: { id: true },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.SUPPORT_REQUEST_CREATE,
    entity: 'SupportRequest',
    entityId: req.id,
    meta: { centerId: center.id, estimatedCostPkr: input.estimatedCostPkr },
    ip: ctx.ip,
  });
  return req.id;
}

export type CentreSupportRow = {
  id: string;
  publicCode: string;
  treatment: string;
  estimatedCostPkr: number;
  fundedPkr: number;
  status: string;
  statusReason: string | null;
  patientId: string;
  createdAt: string;
};

export async function listCentreSupport(center: Center): Promise<CentreSupportRow[]> {
  const rows = await prisma.supportRequest.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    publicCode: r.publicCode,
    treatment: r.treatment,
    estimatedCostPkr: r.estimatedCostPkr,
    fundedPkr: r.fundedPkr,
    status: r.status,
    statusReason: r.statusReason,
    patientId: r.patientId,
    createdAt: r.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Public                                                                    */
/* -------------------------------------------------------------------------- */

export type PublicSupportRow = {
  publicCode: string;
  treatment: string;
  estimatedCostPkr: number;
  fundedPkr: number;
  status: 'APPROVED' | 'FUNDED';
  blurbEn: string;
  blurbUr: string | null;
  sponsor: string | null;
  centre: { name: string; city: string };
};

/** Approved and funded requests. A DB failure degrades to an empty page rather than an error. */
export async function listPublicSupport(): Promise<{ items: PublicSupportRow[]; fundedTotalPkr: number; fundedCount: number }> {
  try {
    const rows = await prisma.supportRequest.findMany({
      where: { status: { in: ['APPROVED', 'FUNDED'] } },
      orderBy: [{ status: 'asc' }, { approvedAt: 'desc' }], // APPROVED sorts before FUNDED
      take: 60,
      include: { center: { select: { nameEn: true, city: true } } },
    });
    const sums = await prisma.supportRequest.aggregate({
      where: { status: { in: ['APPROVED', 'FUNDED', 'CLOSED'] } },
      _sum: { fundedPkr: true },
      _count: { _all: true },
    });
    const fundedCount = await prisma.supportRequest.count({ where: { status: { in: ['FUNDED', 'CLOSED'] }, fundedPkr: { gt: 0 } } });
    return {
      items: rows.map((r) => ({
        publicCode: r.publicCode,
        treatment: r.treatment,
        estimatedCostPkr: r.estimatedCostPkr,
        fundedPkr: r.fundedPkr,
        status: r.status as 'APPROVED' | 'FUNDED',
        blurbEn: r.blurbEn,
        blurbUr: r.blurbUr,
        sponsor: r.showSponsor ? r.sponsorName : null,
        centre: { name: r.center.nameEn, city: r.center.city },
      })),
      fundedTotalPkr: sums._sum.fundedPkr ?? 0,
      fundedCount,
    };
  } catch (error) {
    console.error('[support fund] listing failed', error instanceof Error ? error.message : error);
    return { items: [], fundedTotalPkr: 0, fundedCount: 0 };
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminSupportRow = {
  id: string;
  publicCode: string;
  centerId: string;
  trackingCode: string;
  centre: { name: string; city: string };
  treatment: string;
  estimatedCostPkr: number;
  fundedPkr: number;
  status: string;
  blurbEn: string;
  blurbUr: string | null;
  sponsorName: string | null;
  showSponsor: boolean;
  statusReason: string | null;
  createdAt: string;
};

export async function listAdminSupport(
  query: { status?: string; page: number },
): Promise<{ items: AdminSupportRow[]; page: number; total: number; pageSize: number }> {
  const where: Prisma.SupportRequestWhereInput = query.status ? { status: query.status as 'SUBMITTED' } : {};
  const [rows, total] = await Promise.all([
    prisma.supportRequest.findMany({
      where,
      orderBy: { createdAt: query.status === 'SUBMITTED' ? 'asc' : 'desc' }, // the review queue is oldest first
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        center: { select: { nameEn: true, city: true } },
        patient: { select: { trackingCode: true } },
      },
    }),
    prisma.supportRequest.count({ where }),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      publicCode: r.publicCode,
      centerId: r.centerId,
      trackingCode: r.patient.trackingCode,
      centre: { name: r.center.nameEn, city: r.center.city },
      treatment: r.treatment,
      estimatedCostPkr: r.estimatedCostPkr,
      fundedPkr: r.fundedPkr,
      status: r.status,
      blurbEn: r.blurbEn,
      blurbUr: r.blurbUr,
      sponsorName: r.sponsorName,
      showSponsor: r.showSponsor,
      statusReason: r.statusReason,
      createdAt: r.createdAt.toISOString(),
    })),
    page: query.page,
    total,
    pageSize: PAGE_SIZE,
  };
}

export async function reviewSupportRequest(
  id: string,
  action: SupportReviewInput,
  ctx: Ctx,
): Promise<void> {
  const req = await prisma.supportRequest.findUnique({ where: { id } });
  if (!req) throw new RegistryApiError(404, 'not-found');
  const invalid = () => new RegistryApiError(409, 'invalid-transition');
  const reviewedById = ctx.actorId;

  switch (action.action) {
    case 'APPROVE':
      if (req.status !== 'SUBMITTED') throw invalid();
      await prisma.supportRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          reviewedById,
          statusReason: null,
          ...(action.estimatedCostPkr ? { estimatedCostPkr: action.estimatedCostPkr } : {}),
          ...(action.blurbEn ? { blurbEn: action.blurbEn } : {}),
          ...(action.blurbUr !== undefined ? { blurbUr: action.blurbUr || null } : {}),
        },
      });
      break;
    case 'REJECT':
      if (req.status !== 'SUBMITTED') throw invalid();
      await prisma.supportRequest.update({ where: { id }, data: { status: 'REJECTED', statusReason: action.reason, reviewedById } });
      break;
    case 'RECORD_FUNDING': {
      if (req.status !== 'APPROVED') throw invalid();
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.supportRequest.updateMany({
          where: { id, status: 'APPROVED' },
          data: { fundedPkr: { increment: action.amountPkr } },
        });
        if (claimed.count === 0) throw invalid();
        const row = await tx.supportRequest.findUnique({
          where: { id },
          select: { fundedPkr: true, estimatedCostPkr: true },
        });
        if (!row) throw invalid();
        await tx.supportRequest.update({
          where: { id },
          data: {
            ...(row.fundedPkr >= row.estimatedCostPkr ? { status: 'FUNDED' as const } : {}),
            ...(action.sponsorName ? { sponsorName: action.sponsorName, showSponsor: action.showSponsor } : {}),
          },
        });
      });
      break;
    }
    case 'CLOSE':
      if (req.status !== 'APPROVED' && req.status !== 'FUNDED') throw invalid();
      await prisma.supportRequest.update({ where: { id }, data: { status: 'CLOSED', statusReason: action.reason || null, reviewedById } });
      break;
  }

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'admin',
    action: AuditAction.SUPPORT_REQUEST_REVIEW,
    entity: 'SupportRequest',
    entityId: id,
    meta: { action: action.action, ...(action.action === 'RECORD_FUNDING' ? { amountPkr: action.amountPkr } : {}) },
    ip: ctx.ip,
  });
}
