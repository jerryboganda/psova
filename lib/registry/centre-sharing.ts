// Sharing a centre's case (docs/centres/PLAN.md). Three routes, all deliberate and audited:
//  - NVAR: the centre opts a case into the national registry (enters the admin queue as PENDING).
//  - Referral (identified): on accept, the receiving centre gets its OWN copy of the record, so
//    every centre keeps scoping its data by centerId. Until accepted it sees only a de-identified summary.
//  - Second opinion (de-identified): read-only summary + teaching-consented files, answered in writing.
// Owners and doctors only; the routes enforce roles.

import type { Center } from '@prisma/client';
import { prisma } from './db';
import { decryptNullable, encryptNullable } from './crypto';
import { writeAudit } from './audit';
import { AuditAction, ageBandKey } from './constants';
import { RegistryApiError } from './guards';
import { generateUniqueTrackingCode } from './codes';
import { getListedCenters } from './directory';
import { getFile } from './storage';
import { sendShareNotice } from './mailer';
import { NVAR_VISIBLE } from './visibility';
import type { NvarShareInput, ShareRespondInput, ShareSendInput } from './schemas';

type Ctx = { actorId: string; ip: string | null };

/* -------------------------------------------------------------------------- */
/*  NVAR                                                                      */
/* -------------------------------------------------------------------------- */

export async function updateNvarSharing(
  center: Center,
  patientId: string,
  input: NvarShareInput,
  ctx: Ctx,
): Promise<void> {
  const p = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true, status: true, consentRegistry: true, sharedWithNvar: true, cnicHash: true, phoneHash: true },
  });
  if (!p) throw new RegistryApiError(404, 'not-found');

  if (input.action === 'SHARE') {
    if (p.sharedWithNvar) throw new RegistryApiError(409, 'conflict');
    // Consent to NVAR is the patient's: either recorded at intake or confirmed by staff now.
    if (!p.consentRegistry && !input.consentConfirmed) throw new RegistryApiError(400, 'validation');
    const dup = await prisma.registryPatient.findFirst({
      where: { AND: [NVAR_VISIBLE, { id: { not: p.id }, OR: [{ cnicHash: p.cnicHash }, { phoneHash: p.phoneHash }] }] },
      select: { id: true },
    });
    await prisma.registryPatient.update({
      where: { id: p.id },
      data: {
        sharedWithNvar: true,
        sharedAt: new Date(),
        consentRegistry: true,
        status: 'PENDING',
        possibleDuplicate: dup !== null,
      },
    });
    await writeAudit({
      actorId: ctx.actorId,
      actorRole: 'center',
      action: AuditAction.CENTER_SHARE_NVAR,
      entity: 'RegistryPatient',
      entityId: p.id,
      meta: { centerId: center.id, consentConfirmedByStaff: !p.consentRegistry },
      ip: ctx.ip,
    });
    return;
  }

  // Withdraw: only before NVAR has counted the record.
  if (!p.sharedWithNvar) throw new RegistryApiError(409, 'conflict');
  if (p.status === 'VERIFIED' || p.status === 'DUPLICATE') throw new RegistryApiError(409, 'invalid-transition');
  await prisma.registryPatient.update({ where: { id: p.id }, data: { sharedWithNvar: false, sharedAt: null } });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_NVAR_WITHDRAW,
    entity: 'RegistryPatient',
    entityId: p.id,
    meta: { centerId: center.id },
    ip: ctx.ip,
  });
}

/* -------------------------------------------------------------------------- */
/*  Referrals and second opinions                                             */
/* -------------------------------------------------------------------------- */

/** Other live centres a case can be sent to. */
export async function listShareTargets(center: Center): Promise<{ id: string; name: string; city: string }[]> {
  return (await getListedCenters())
    .filter((c) => c.id !== center.id)
    .map((c) => ({ id: c.id, name: c.nameEn, city: c.city }));
}

export async function sendShare(
  center: Center,
  patientId: string,
  input: ShareSendInput,
  ctx: Ctx,
): Promise<string> {
  const patient = await prisma.registryPatient.findFirst({ where: { id: patientId, centerId: center.id }, select: { id: true } });
  if (!patient) throw new RegistryApiError(404, 'not-found');
  const target = (await getListedCenters()).find((c) => c.id === input.toCenterId);
  if (!target || target.id === center.id) throw new RegistryApiError(400, 'validation');

  // One open request of a kind per patient and destination.
  const open = await prisma.caseShare.findFirst({
    where: { patientId, toCenterId: target.id, type: input.type, status: 'SENT' },
    select: { id: true },
  });
  if (open) throw new RegistryApiError(409, 'conflict');

  const share = await prisma.caseShare.create({
    data: {
      patientId,
      fromCenterId: center.id,
      toCenterId: target.id,
      type: input.type,
      note: encryptNullable(input.note),
      createdById: ctx.actorId,
    },
    select: { id: true },
  });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_SHARE_SEND,
    entity: 'CaseShare',
    entityId: share.id,
    meta: { fromCenterId: center.id, toCenterId: target.id, type: input.type },
    ip: ctx.ip,
  });
  void sendShareNotice(target.email, center.nameEn, 'received', input.type);
  return share.id;
}

export type ShareSummary = {
  gender: string;
  ageBand: string;
  province: string;
  conditionSlug: string | null;
  bodySite: string | null;
  severity: string | null;
  basis: string | null;
  treatments: { type: string; year: number | null; outcome: string }[];
};

export type ShareRow = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  centre: { name: string; city: string };
  note: string | null;
  response: string | null;
  /** Outgoing: the patient in this centre. Incoming accepted referral: the copy in this centre. */
  patientId: string | null;
  /** Incoming only, and only while it is de-identified. */
  summary: ShareSummary | null;
  documents: { id: string; kind: string; mime: string; size: number }[];
};

export async function listShares(
  center: Center,
  direction: 'incoming' | 'outgoing',
  ctx?: { actorId: string; ip: string | null },
): Promise<ShareRow[]> {
  const incoming = direction === 'incoming';
  const rows = await prisma.caseShare.findMany({
    where: incoming ? { toCenterId: center.id } : { fromCenterId: center.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      fromCenter: { select: { nameEn: true, city: true } },
      toCenter: { select: { nameEn: true, city: true } },
      patient: {
        select: {
          gender: true,
          birthYear: true,
          province: true,
          diagnoses: { take: 1, orderBy: { createdAt: 'asc' }, include: { treatments: true } },
          documents: { where: { consentForTeaching: true }, select: { id: true, kind: true, mime: true, size: true } },
        },
      },
    },
  });

  const year = new Date().getFullYear();
  const result = rows.map((r) => {
    const other = incoming ? r.fromCenter : r.toCenter;
    const d = r.patient.diagnoses[0];
    // The sender's patient record is never exposed to the receiver; only this summary.
    const summary: ShareSummary | null =
      incoming && r.status !== 'DECLINED'
        ? {
            gender: r.patient.gender,
            ageBand: ageBandKey(Math.max(0, year - r.patient.birthYear)),
            province: r.patient.province,
            conditionSlug: d?.conditionSlug ?? null,
            bodySite: d?.bodySite ?? null,
            severity: d?.severity ?? null,
            basis: d?.basis ?? null,
            treatments: (d?.treatments ?? []).map((t) => ({ type: t.type, year: t.year, outcome: t.outcome })),
          }
        : null;
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      respondedAt: r.respondedAt?.toISOString() ?? null,
      centre: { name: other.nameEn, city: other.city },
      note: decryptNullable(r.note),
      response: decryptNullable(r.response),
      patientId: incoming ? r.copiedPatientId : r.patientId,
      summary,
      documents: incoming && r.type === 'SECOND_OPINION' && r.status === 'SENT' ? r.patient.documents : [],
    };
  });

  if (ctx) {
    await writeAudit({
      actorId: ctx.actorId,
      actorRole: 'center',
      action: AuditAction.CENTER_SHARE_VIEW,
      entity: 'CaseShare',
      meta: { centerId: center.id, direction, count: result.length },
      ip: ctx.ip,
    });
  }
  return result;
}

/** Open requests waiting for this centre (dashboard badge). */
export function countIncomingShares(center: Center): Promise<number> {
  return prisma.caseShare.count({ where: { toCenterId: center.id, status: 'SENT' } });
}

export async function respondToShare(
  center: Center,
  shareId: string,
  input: ShareRespondInput,
  ctx: Ctx,
): Promise<{ copiedPatientId?: string }> {
  const share = await prisma.caseShare.findFirst({
    where: { id: shareId, toCenterId: center.id, status: 'SENT' },
    include: { fromCenter: { select: { email: true, nameEn: true } } },
  });
  if (!share) throw new RegistryApiError(404, 'not-found');
  const now = new Date();
  const base = { respondedAt: now, respondedById: ctx.actorId };
  let copiedPatientId: string | undefined;
  let outcome: 'accepted' | 'declined' | 'answered';

  if (input.action === 'ACCEPT') {
    if (share.type !== 'REFERRAL') throw new RegistryApiError(400, 'validation');
    copiedPatientId = await copyPatientToCentre(share.patientId, center.id);
    await prisma.caseShare.update({ where: { id: share.id }, data: { ...base, status: 'ACCEPTED', copiedPatientId } });
    outcome = 'accepted';
  } else if (input.action === 'DECLINE') {
    await prisma.caseShare.update({
      where: { id: share.id },
      data: { ...base, status: 'DECLINED', response: encryptNullable(input.reason) },
    });
    outcome = 'declined';
  } else {
    if (share.type !== 'SECOND_OPINION') throw new RegistryApiError(400, 'validation');
    await prisma.caseShare.update({
      where: { id: share.id },
      data: { ...base, status: 'COMPLETED', response: encryptNullable(input.response) },
    });
    outcome = 'answered';
  }

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_SHARE_RESPOND,
    entity: 'CaseShare',
    entityId: share.id,
    meta: { toCenterId: center.id, type: share.type, action: input.action },
    ip: ctx.ip,
  });
  void sendShareNotice(share.fromCenter.email, center.nameEn, outcome, share.type);
  return { copiedPatientId };
}

/**
 * Referral accepted: give the receiving centre its own record. Encrypted fields are copied as
 * ciphertext (same key), the diagnosis and treatment history comes along, visits/appointments/files
 * do not. It gets a fresh tracking code and starts private to the new centre (not shared with NVAR).
 */
async function copyPatientToCentre(patientId: string, toCenterId: string): Promise<string> {
  const src = await prisma.registryPatient.findUnique({
    where: { id: patientId },
    include: { diagnoses: { include: { treatments: true } } },
  });
  if (!src) throw new RegistryApiError(404, 'not-found');
  const trackingCode = await generateUniqueTrackingCode(
    async (code) => (await prisma.registryPatient.findUnique({ where: { trackingCode: code }, select: { id: true } })) !== null,
  );
  const copy = await prisma.registryPatient.create({
    data: {
      trackingCode,
      status: 'PENDING',
      source: 'CLINICIAN',
      centerId: toCenterId,
      consentCentre: true, // the referring centre attested the patient agreed to the referral
      consentRegistry: false, // NVAR consent is asked again by the new centre
      consentContact: src.consentContact,
      consentResearch: src.consentResearch,
      consentGuardian: src.consentGuardian,
      consentVersion: 'v1-referral',
      fullName: src.fullName,
      guardianName: src.guardianName,
      cnic: src.cnic,
      phone: src.phone,
      altPhone: src.altPhone,
      email: src.email,
      address: src.address,
      dob: src.dob,
      cnicHash: src.cnicHash,
      phoneHash: src.phoneHash,
      gender: src.gender,
      province: src.province,
      district: src.district,
      birthYear: src.birthYear,
      birthMonth: src.birthMonth,
      isMinor: src.isMinor,
      diagnoses: {
        create: src.diagnoses.map((d) => ({
          conditionSlug: d.conditionSlug,
          conditionOther: d.conditionOther,
          issvaCategory: d.issvaCategory,
          bodySite: d.bodySite,
          onset: d.onset,
          doctorDiagnosed: d.doctorDiagnosed,
          severity: d.severity,
          basis: d.basis,
          facility: d.facility,
          notes: d.notes,
          treatments: {
            create: d.treatments.map((t) => ({
              type: t.type,
              facility: t.facility,
              year: t.year,
              outcome: t.outcome,
              date: t.date,
              drug: t.drug,
              dose: t.dose,
              complications: t.complications,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });
  return copy.id;
}

/** A second-opinion file, opened by the receiving centre. Audited. Only teaching-consented files of the shared patient. */
export async function readSharedDocument(
  center: Center,
  shareId: string,
  documentId: string,
  ctx: Ctx,
): Promise<{ bytes: Buffer; mime: string; fileName: string }> {
  const share = await prisma.caseShare.findFirst({
    where: { id: shareId, toCenterId: center.id, type: 'SECOND_OPINION', status: 'SENT' },
    select: { id: true, patientId: true },
  });
  if (!share) throw new RegistryApiError(404, 'not-found');
  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId: share.patientId, consentForTeaching: true },
  });
  if (!doc) throw new RegistryApiError(404, 'not-found');
  const bytes = await getFile(doc.centerId, doc.storageKey);
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_SHARE_VIEW,
    entity: 'PatientDocument',
    entityId: doc.id,
    meta: { toCenterId: center.id, shareId: share.id },
    ip: ctx.ip,
  });
  // The original name may identify the patient; the receiver only gets a neutral one.
  return { bytes, mime: doc.mime, fileName: `${doc.kind.toLowerCase()}-${doc.id.slice(-6)}` };
}

/** For the patient page: this patient's outgoing shares (no decryption of anything but the note/response). */
export async function listPatientShares(center: Center, patientId: string): Promise<ShareRow[]> {
  return (await listShares(center, 'outgoing')).filter((s) => s.patientId === patientId);
}

