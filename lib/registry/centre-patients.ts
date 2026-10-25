// Centre-owned patients (docs/centres/PLAN.md). Every read here is scoped to one centre and
// audited: centre staff see their own patients' PII, which is a decrypt-for-display.

import { Prisma, type Center, type RegistryPatient } from '@prisma/client';
import { prisma } from './db';
import { blindIndex, decryptField, encryptField, encryptNullable } from './crypto';
import { writeAudit } from './audit';
import { AuditAction, type CenterRoleValue } from './constants';
import { RegistryApiError } from './guards';
import { normalizeTrackingCode } from './codes';
import { isValidCnic, isValidPkMobile } from './normalize';
import {
  createClinicianCase,
  createEnrollment,
  getDecryptedRecord,
  type DecryptedRecord,
} from './patients';
import type { CaseInput, CentreIntakeInput, CentrePatientUpdateInput } from './schemas';

const PAGE_SIZE = 20;
/** ponytail: name search decrypts this many newest records in memory; add a name-token blind index beyond it. */
const NAME_SCAN_LIMIT = 3000;

export type CentrePatientRow = {
  id: string;
  trackingCode: string;
  mrn: string | null;
  fullName: string;
  phone: string;
  conditionSlug: string;
  source: string;
  possibleDuplicate: boolean;
  sharedWithNvar: boolean;
  createdAt: string;
};

type ListedPatient = Prisma.RegistryPatientGetPayload<{
  include: { diagnoses: { select: { conditionSlug: true }; take: 1 } };
}>;

function toRow(r: ListedPatient): CentrePatientRow {
  return {
    id: r.id,
    trackingCode: r.trackingCode,
    mrn: r.mrn,
    fullName: decryptField(r.fullName),
    phone: decryptField(r.phone),
    conditionSlug: r.diagnoses[0]?.conditionSlug ?? 'not-sure',
    source: r.source,
    possibleDuplicate: r.possibleDuplicate,
    sharedWithNvar: r.sharedWithNvar,
    createdAt: r.createdAt.toISOString(),
  };
}

const include = { diagnoses: { select: { conditionSlug: true }, take: 1 } } as const;

/** Dashboard counters: all patients and those registered in the last 7 days (no decryption). */
export async function patientCounts(center: Center): Promise<{ total: number; recent: number }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, recent] = await Promise.all([
    prisma.registryPatient.count({ where: { centerId: center.id } }),
    prisma.registryPatient.count({ where: { centerId: center.id, createdAt: { gte: weekAgo } } }),
  ]);
  return { total, recent };
}

/** Exact-match lookups the blind indexes allow: tracking code, MRN, CNIC, phone. */
function exactConditions(q: string): Prisma.RegistryPatientWhereInput[] {
  const conditions: Prisma.RegistryPatientWhereInput[] = [{ mrn: q }];
  if (/^psv/i.test(q)) conditions.push({ trackingCode: normalizeTrackingCode(q) });
  if (isValidCnic(q)) conditions.push({ cnicHash: blindIndex(q, 'cnic') });
  if (isValidPkMobile(q)) conditions.push({ phoneHash: blindIndex(q, 'phone') });
  return conditions;
}

export async function listCentrePatients(
  center: Center,
  query: { q?: string; page: number },
  ctx: { actorId: string; ip: string | null },
): Promise<{ items: CentrePatientRow[]; page: number; pageSize: number; total: number }> {
  const q = query.q?.trim() ?? '';
  const skip = (query.page - 1) * PAGE_SIZE;
  let rows: ListedPatient[];
  let total: number;

  const base: Prisma.RegistryPatientWhereInput = { centerId: center.id };
  const exact = q ? { ...base, OR: exactConditions(q) } : base;
  const exactTotal = await prisma.registryPatient.count({ where: exact });

  if (!q || exactTotal > 0) {
    total = exactTotal;
    rows = await prisma.registryPatient.findMany({
      where: exact,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include,
    });
  } else {
    // Names are encrypted, so substring search happens on decrypted names in memory.
    const needle = q.toLowerCase();
    const names = await prisma.registryPatient.findMany({
      where: base,
      orderBy: { createdAt: 'desc' },
      take: NAME_SCAN_LIMIT,
      select: { id: true, fullName: true },
    });
    const hits = names.filter((n) => decryptField(n.fullName).toLowerCase().includes(needle)).map((n) => n.id);
    total = hits.length;
    const pageIds = hits.slice(skip, skip + PAGE_SIZE);
    const found = await prisma.registryPatient.findMany({ where: { id: { in: pageIds } }, include });
    rows = pageIds.map((id) => found.find((f) => f.id === id)).filter((f): f is ListedPatient => Boolean(f));
  }

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_PATIENT_LIST,
    entity: 'RegistryPatient',
    meta: { centerId: center.id, count: rows.length, page: query.page, searched: q !== '' },
    ip: ctx.ip,
  });

  return { items: rows.map(toRow), page: query.page, pageSize: PAGE_SIZE, total };
}

/** One of the centre's own patients, decrypted and audited. Reception never sees clinical notes. */
export async function getCentrePatient(
  center: Center,
  id: string,
  ctx: { actorId: string; role: CenterRoleValue; ip: string | null },
): Promise<DecryptedRecord | null> {
  const record = await getDecryptedRecord(
    id,
    { actorId: ctx.actorId, actorRole: 'center', ip: ctx.ip },
    { restrictCenterId: center.id },
  );
  if (!record) return null;
  if (ctx.role === 'RECEPTION') {
    record.internalNote = null;
    record.diagnoses = record.diagnoses.map((d) => ({ ...d, notes: null, treatments: [] }));
  }
  return record;
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

/** Staff add a patient. The MRN is unique per centre. */
export async function addCentrePatient(
  center: Center,
  input: CaseInput,
  ctx: { actorId: string; ip: string | null },
): Promise<{ trackingCode: string; patientId: string }> {
  try {
    return await createClinicianCase(input, { clinicianId: null, actorId: ctx.actorId, ip: ctx.ip }, { id: center.id });
  } catch (e) {
    if (isUniqueViolation(e)) throw new RegistryApiError(409, 'conflict');
    throw e;
  }
}

/** A patient registering through the centre's QR code / link. */
export function registerViaIntake(
  center: Center,
  input: CentreIntakeInput,
  ctx: { ip: string | null },
): Promise<{ trackingCode: string; patientId: string }> {
  return createEnrollment(input, ctx, { id: center.id });
}

/** Centre staff correcting contact details and recording consent. Scoped + audited. */
export async function updateCentrePatient(
  center: Center,
  patientId: string,
  input: CentrePatientUpdateInput,
  ctx: { actorId: string; ip: string | null },
): Promise<void> {
  const owned = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true },
  });
  if (!owned) throw new RegistryApiError(404, 'not-found');

  const data: Prisma.RegistryPatientUpdateInput = {};
  if (input.phone !== undefined) {
    data.phone = encryptField(input.phone);
    data.phoneHash = blindIndex(input.phone, 'phone');
  }
  if (input.altPhone !== undefined) data.altPhone = encryptNullable(input.altPhone);
  if (input.email !== undefined) data.email = encryptNullable(input.email);
  if (input.address !== undefined) data.address = encryptNullable(input.address);
  if (input.consentContact !== undefined) data.consentContact = input.consentContact;
  if (input.consentResearch !== undefined) data.consentResearch = input.consentResearch;
  if (input.consentContact !== undefined || input.consentResearch !== undefined) {
    data.consentAt = new Date();
  }

  await prisma.registryPatient.update({ where: { id: patientId }, data });
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.CENTER_PATIENT_UPDATE,
    entity: 'RegistryPatient',
    entityId: patientId,
    meta: { centerId: center.id, fields: Object.keys(data).filter((k) => k !== 'consentAt') },
    ip: ctx.ip,
  });
}

/** Audit that staff opened WhatsApp for a patient (no PII, no message text). */
export async function logWhatsApp(
  center: Center,
  patientId: string,
  template: string,
  ctx: { actorId: string; ip: string | null },
): Promise<void> {
  const owned: Pick<RegistryPatient, 'id'> | null = await prisma.registryPatient.findFirst({
    where: { id: patientId, centerId: center.id },
    select: { id: true },
  });
  if (!owned) throw new RegistryApiError(404, 'not-found');
  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'center',
    action: AuditAction.WHATSAPP_OPENED,
    entity: 'RegistryPatient',
    entityId: patientId,
    meta: { centerId: center.id, template },
    ip: ctx.ip,
  });
}
