// Registry domain service. Server-only (imports crypto). Encapsulates the
// encrypt → hash → transaction → audit flow so routes stay thin (ARCHITECTURE §3).
// P3 scope: createEnrollment, statusLookup. Later phases add clinician/admin ops.

import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import {
  encryptField,
  encryptNullable,
  decryptField,
  decryptNullable,
  blindIndex,
} from './crypto';
import { deriveDobParts } from './normalize';
import { generateUniqueTrackingCode, normalizeTrackingCode } from './codes';
import { writeAudit } from './audit';
import { AuditAction, type ActorRole } from './constants';
import { sendEnrollmentConfirmation, sendClinicianApproval } from './mailer';
import { RegistryApiError } from './guards';
import { NVAR_VISIBLE, isNvarVisible } from './visibility';
import type {
  CaseInput,
  CasesQuery,
  EnrollInput,
  StatusInput,
  AdminRecordsQuery,
  AdminCliniciansQuery,
  AdminAuditQuery,
  AdminExportQuery,
  AdminActionInput,
  ClinicianActionInput,
  CentreIntakeInput,
} from './schemas';

/** First whitespace-delimited token of a decrypted full name (public/status use). */
export function firstToken(name: string): string {
  const trimmed = name.trim();
  const space = trimmed.search(/\s/);
  return space === -1 ? trimmed : trimmed.slice(0, space);
}

async function trackingCodeExists(code: string): Promise<boolean> {
  const row = await prisma.registryPatient.findUnique({
    where: { trackingCode: code },
    select: { id: true },
  });
  return row !== null;
}

/* -------------------------------------------------------------------------- */
/*  Enrollment (self)                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Self-enrollment. With `centre`, this is a patient registering through a centre's QR
 * code: the record belongs to that centre and stays private to it (NVAR_VISIBLE), the
 * duplicate check is scoped to the centre, and NVAR consent is the patient's own choice.
 */
export async function createEnrollment(
  input: EnrollInput | CentreIntakeInput,
  ctx: { ip: string | null },
  centre?: { id: string },
): Promise<{ trackingCode: string; patientId: string }> {
  const cnicHash = blindIndex(input.cnic, 'cnic');
  const phoneHash = blindIndex(input.phone, 'phone');
  const { year, month, isMinor } = deriveDobParts(input.dob);

  const trackingCode = await generateUniqueTrackingCode(trackingCodeExists);

  // Duplicate detection via blind index — flags, never blocks (PRD A2).
  const dup = await prisma.registryPatient.findFirst({
    where: {
      AND: [centre ? { centerId: centre.id } : NVAR_VISIBLE, { OR: [{ cnicHash }, { phoneHash }] }],
    },
    select: { id: true },
  });
  const possibleDuplicate = dup !== null;

  const patient = await prisma.$transaction((tx) =>
    tx.registryPatient.create({
      data: {
        trackingCode,
        status: 'PENDING',
        source: 'SELF',
        ...(centre ? { centerId: centre.id, consentCentre: true } : {}),
        possibleDuplicate,
        // PII — encrypted before write
        fullName: encryptField(input.fullName),
        guardianName: encryptNullable(input.guardianName),
        cnic: encryptField(input.cnic),
        phone: encryptField(input.phone),
        altPhone: encryptNullable(input.altPhone),
        email: encryptNullable(input.email),
        address: encryptNullable(input.address),
        dob: encryptField(input.dob),
        // blind indexes
        cnicHash,
        phoneHash,
        // non-PII demographics
        gender: input.gender,
        province: input.province,
        district: input.district,
        birthYear: year,
        birthMonth: month,
        isMinor,
        // consent
        consentRegistry: input.consentRegistry,
        consentContact: input.consentContact,
        consentResearch: input.consentResearch,
        consentGuardian: input.consentGuardian,
        consentVersion: 'v1',
        diagnoses: {
          create: {
            conditionSlug: input.conditionSlug,
            conditionOther:
              input.conditionSlug === 'other' ? (input.conditionOther ?? null) : null,
            bodySite: input.bodySite,
            onset: input.onset,
            doctorDiagnosed: input.doctorDiagnosed,
            facility: input.facility ?? null,
            notes: encryptNullable(input.treatmentNotes),
          },
        },
      },
      select: { id: true, trackingCode: true },
    }),
  );

  await writeAudit({
    actorRole: 'public',
    action: centre ? AuditAction.CENTER_INTAKE : AuditAction.ENROLL_SUBMIT,
    entity: 'RegistryPatient',
    entityId: patient.id,
    meta: {
      source: 'SELF',
      ...(centre ? { centerId: centre.id } : {}),
      province: input.province,
      conditionSlug: input.conditionSlug,
      possibleDuplicate,
    },
    ip: ctx.ip,
  });

  // Fire-and-forget confirmation (tracking code only; never fails the request).
  if (input.email && input.email !== '') {
    void sendEnrollmentConfirmation(input.email, trackingCode);
  }

  return { trackingCode: patient.trackingCode, patientId: patient.id };
}

/* -------------------------------------------------------------------------- */
/*  Status lookup (code + phone blind index)                                  */
/* -------------------------------------------------------------------------- */

export type PublicStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CENTRE';

export type StatusResult = {
  status: PublicStatus;
  submittedAt: string;
  firstName: string;
  publicReason?: string;
  /** Present when the record belongs to a centre and has not been shared with NVAR. */
  centre?: { en: string; ur: string };
  nextAppointment?: { startsAt: string; kind: string };
};

export async function statusLookup(
  input: StatusInput,
  ctx: { ip: string | null },
): Promise<StatusResult | null> {
  const code = normalizeTrackingCode(input.trackingCode);
  const phoneHash = blindIndex(input.phone, 'phone');

  // Dual factor: both the code AND the phone blind index must match.
  const patient = await prisma.registryPatient.findFirst({
    where: { trackingCode: code, phoneHash },
    select: {
      id: true,
      status: true,
      fullName: true,
      createdAt: true,
      publicReason: true,
      centerId: true,
      sharedWithNvar: true,
      center: { select: { nameEn: true, nameUr: true } },
      appointments: {
        where: { status: 'SCHEDULED', startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        take: 1,
        select: { startsAt: true, kind: true },
      },
    },
  });

  await writeAudit({
    actorRole: 'public',
    action: AuditAction.STATUS_LOOKUP,
    entity: 'RegistryPatient',
    entityId: patient?.id ?? null,
    meta: { found: patient !== null },
    ip: ctx.ip,
  });

  if (!patient) return null;

  // Registered with a centre and not (yet) shared with NVAR: there is no NVAR review to report.
  if (!isNvarVisible(patient) && patient.center) {
    return {
      status: 'CENTRE',
      submittedAt: patient.createdAt.toISOString(),
      firstName: firstToken(decryptField(patient.fullName)),
      centre: { en: patient.center.nameEn, ur: patient.center.nameUr || patient.center.nameEn },
      nextAppointment: patient.appointments[0]
        ? { startsAt: patient.appointments[0].startsAt.toISOString(), kind: patient.appointments[0].kind }
        : undefined,
    };
  }

  // DUPLICATE presents as VERIFIED to the public (same family, merged record).
  const publicStatus: PublicStatus =
    patient.status === 'DUPLICATE'
      ? 'VERIFIED'
      : (patient.status as PublicStatus);

  return {
    status: publicStatus,
    submittedAt: patient.createdAt.toISOString(),
    firstName: firstToken(decryptField(patient.fullName)),
    publicReason:
      patient.status === 'REJECTED' ? (patient.publicReason ?? undefined) : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  Clinician case submission                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Clinician case submission. With `centre` it is a centre staff member adding a
 * patient: the record belongs to the centre (private until shared), carries the
 * centre's MRN, and NVAR consent is NOT assumed — it is recorded when sharing.
 */
export async function createClinicianCase(
  input: CaseInput,
  ctx: { clinicianId: string | null; actorId: string; ip: string | null },
  centre?: { id: string },
): Promise<{ trackingCode: string; patientId: string }> {
  const cnicHash = blindIndex(input.cnic, 'cnic');
  const phoneHash = blindIndex(input.phone, 'phone');
  const { year, month, isMinor } = deriveDobParts(input.dob);

  const trackingCode = await generateUniqueTrackingCode(trackingCodeExists);

  const dup = await prisma.registryPatient.findFirst({
    where: {
      AND: [centre ? { centerId: centre.id } : NVAR_VISIBLE, { OR: [{ cnicHash }, { phoneHash }] }],
    },
    select: { id: true },
  });
  const possibleDuplicate = dup !== null;

  const patient = await prisma.$transaction((tx) =>
    tx.registryPatient.create({
      data: {
        trackingCode,
        status: 'PENDING',
        source: 'CLINICIAN',
        clinicianId: ctx.clinicianId,
        ...(centre ? { centerId: centre.id, mrn: input.mrn || null, consentCentre: true } : {}),
        possibleDuplicate,
        fullName: encryptField(input.fullName),
        guardianName: encryptNullable(input.guardianName),
        cnic: encryptField(input.cnic),
        phone: encryptField(input.phone),
        altPhone: encryptNullable(input.altPhone),
        email: encryptNullable(input.email),
        address: encryptNullable(input.address),
        dob: encryptField(input.dob),
        cnicHash,
        phoneHash,
        gender: input.gender,
        province: input.province,
        district: input.district,
        birthYear: year,
        birthMonth: month,
        isMinor,
        // consent recorded from the clinician's attestation (API-SPEC §3)
        consentRegistry: !centre,
        consentContact: false,
        consentResearch: false,
        consentGuardian: isMinor,
        consentVersion: centre ? 'v1-centre' : 'v1-clinician',
        diagnoses: {
          create: {
            conditionSlug: input.conditionSlug,
            conditionOther:
              input.conditionSlug === 'other' ? (input.conditionOther ?? null) : null,
            bodySite: input.bodySite,
            onset: input.onset,
            doctorDiagnosed: 'yes',
            issvaCategory: input.issvaCategory,
            severity: input.severity,
            basis: input.basis,
            facility: input.facility ?? null,
            notes: encryptNullable(input.clinicalNotes),
            treatments: {
              create: input.treatments.map((tx2) => ({
                type: tx2.type,
                facility: tx2.facility ?? null,
                year: tx2.year ?? null,
                outcome: tx2.outcome,
              })),
            },
          },
        },
      },
      select: { id: true, trackingCode: true },
    }),
  );

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: centre ? 'center' : 'clinician',
    action: AuditAction.CASE_SUBMIT,
    entity: 'RegistryPatient',
    entityId: patient.id,
    meta: {
      source: 'CLINICIAN',
      ...(centre ? { centerId: centre.id } : {}),
      province: input.province,
      conditionSlug: input.conditionSlug,
      issvaCategory: input.issvaCategory,
      possibleDuplicate,
    },
    ip: ctx.ip,
  });

  return { trackingCode: patient.trackingCode, patientId: patient.id };
}

/* -------------------------------------------------------------------------- */
/*  Case listing (clinician-owned) — first-name only, like status lookup      */
/* -------------------------------------------------------------------------- */

export const PAGE_SIZE = 20;

export type CaseListRow = {
  id: string;
  trackingCode: string;
  firstName: string;
  conditionSlug: string;
  status: string;
  createdAt: string;
};

export async function listClinicianCases(
  clinicianId: string,
  query: CasesQuery,
): Promise<{ items: CaseListRow[]; page: number; pageSize: number; total: number }> {
  const where: Prisma.RegistryPatientWhereInput = {
    clinicianId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.registryPatient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        trackingCode: true,
        fullName: true,
        status: true,
        createdAt: true,
        diagnoses: { select: { conditionSlug: true }, take: 1 },
      },
    }),
    prisma.registryPatient.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      trackingCode: r.trackingCode,
      firstName: firstToken(decryptField(r.fullName)),
      conditionSlug: r.diagnoses[0]?.conditionSlug ?? 'not-sure',
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
  };
}

/* -------------------------------------------------------------------------- */
/*  Full decrypted record (clinician-own detail & admin detail)               */
/* -------------------------------------------------------------------------- */

type RecordWithRelations = Prisma.RegistryPatientGetPayload<{
  include: {
    diagnoses: { include: { treatments: true } };
    clinician: { include: { user: { select: { name: true; email: true } } } };
  };
}>;

export type DecryptedTreatment = {
  id: string;
  type: string;
  facility: string | null;
  year: number | null;
  outcome: string;
};

export type DecryptedDiagnosis = {
  id: string;
  conditionSlug: string;
  conditionOther: string | null;
  issvaCategory: string;
  bodySite: string;
  onset: string;
  doctorDiagnosed: string;
  severity: string;
  basis: string;
  facility: string | null;
  notes: string | null;
  treatments: DecryptedTreatment[];
};

export type DecryptedRecord = {
  id: string;
  trackingCode: string;
  status: string;
  source: string;
  possibleDuplicate: boolean;
  duplicateOfId: string | null;
  publicReason: string | null;
  internalNote: string | null;
  mrn: string | null;
  sharedWithNvar: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // decrypted PII
  fullName: string;
  guardianName: string | null;
  cnic: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  address: string | null;
  dob: string;
  // demographics
  gender: string;
  province: string;
  district: string;
  birthYear: number;
  birthMonth: number;
  isMinor: boolean;
  // consent
  consent: {
    registry: boolean;
    contact: boolean;
    research: boolean;
    guardian: boolean;
    version: string;
    at: string;
  };
  clinician: { id: string; name: string; facility: string } | null;
  diagnoses: DecryptedDiagnosis[];
};

function mapDecrypted(rec: RecordWithRelations): DecryptedRecord {
  return {
    id: rec.id,
    trackingCode: rec.trackingCode,
    status: rec.status,
    source: rec.source,
    possibleDuplicate: rec.possibleDuplicate,
    duplicateOfId: rec.duplicateOfId,
    publicReason: rec.publicReason,
    internalNote: rec.internalNote,
    mrn: rec.mrn,
    sharedWithNvar: rec.sharedWithNvar,
    verifiedAt: rec.verifiedAt ? rec.verifiedAt.toISOString() : null,
    createdAt: rec.createdAt.toISOString(),
    updatedAt: rec.updatedAt.toISOString(),
    fullName: decryptField(rec.fullName),
    guardianName: decryptNullable(rec.guardianName),
    cnic: decryptField(rec.cnic),
    phone: decryptField(rec.phone),
    altPhone: decryptNullable(rec.altPhone),
    email: decryptNullable(rec.email),
    address: decryptNullable(rec.address),
    dob: decryptField(rec.dob),
    gender: rec.gender,
    province: rec.province,
    district: rec.district,
    birthYear: rec.birthYear,
    birthMonth: rec.birthMonth,
    isMinor: rec.isMinor,
    consent: {
      registry: rec.consentRegistry,
      contact: rec.consentContact,
      research: rec.consentResearch,
      guardian: rec.consentGuardian,
      version: rec.consentVersion,
      at: rec.consentAt.toISOString(),
    },
    clinician: rec.clinician
      ? {
          id: rec.clinician.id,
          name: rec.clinician.user.name,
          facility: rec.clinician.facility,
        }
      : null,
    diagnoses: rec.diagnoses.map((d) => ({
      id: d.id,
      conditionSlug: d.conditionSlug,
      conditionOther: d.conditionOther,
      issvaCategory: d.issvaCategory,
      bodySite: d.bodySite,
      onset: d.onset,
      doctorDiagnosed: d.doctorDiagnosed,
      severity: d.severity,
      basis: d.basis,
      facility: d.facility,
      notes: decryptNullable(d.notes),
      treatments: d.treatments.map((tr) => ({
        id: tr.id,
        type: tr.type,
        facility: tr.facility,
        year: tr.year,
        outcome: tr.outcome,
      })),
    })),
  };
}

/**
 * Fetch + decrypt a single record, writing a RECORD_VIEW_PII audit row. Pass
 * `restrictClinicianId` to scope to a clinician's own case (404 otherwise).
 */
export async function getDecryptedRecord(
  id: string,
  ctx: { actorId: string | null; actorRole: ActorRole; ip: string | null },
  opts?: { restrictClinicianId?: string; restrictCenterId?: string },
): Promise<DecryptedRecord | null> {
  const rec = await prisma.registryPatient.findFirst({
    where: {
      id,
      ...(opts?.restrictClinicianId ? { clinicianId: opts.restrictClinicianId } : {}),
      // A centre reads its own records; every other reader only sees NVAR-visible ones.
      ...(opts?.restrictCenterId ? { centerId: opts.restrictCenterId } : NVAR_VISIBLE),
    },
    include: {
      diagnoses: { include: { treatments: true } },
      clinician: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!rec) return null;

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    action: AuditAction.RECORD_VIEW_PII,
    entity: 'RegistryPatient',
    entityId: rec.id,
    ip: ctx.ip,
  });

  return mapDecrypted(rec);
}

/* -------------------------------------------------------------------------- */
/*  Admin: record listing (metadata only — NO decryption)                     */
/* -------------------------------------------------------------------------- */

export type AdminRecordRow = {
  id: string;
  trackingCode: string;
  status: string;
  source: string;
  province: string;
  district: string;
  gender: string;
  birthYear: number;
  conditionSlug: string;
  possibleDuplicate: boolean;
  createdAt: string;
};

function buildRecordWhere(query: {
  status?: string;
  province?: string;
  conditionSlug?: string;
  source?: string;
  possibleDuplicate?: 'true' | 'false';
  from?: string;
  to?: string;
  q?: string;
  qType?: 'cnic' | 'phone' | 'code';
}): Prisma.RegistryPatientWhereInput {
  const where: Prisma.RegistryPatientWhereInput = { AND: [NVAR_VISIBLE] };
  if (query.status) where.status = query.status as Prisma.RegistryPatientWhereInput['status'];
  if (query.province) where.province = query.province as Prisma.RegistryPatientWhereInput['province'];
  if (query.source) where.source = query.source as Prisma.RegistryPatientWhereInput['source'];
  if (query.possibleDuplicate) where.possibleDuplicate = query.possibleDuplicate === 'true';
  if (query.conditionSlug) where.diagnoses = { some: { conditionSlug: query.conditionSlug } };
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  }
  if (query.q && query.qType) {
    if (query.qType === 'code') where.trackingCode = normalizeTrackingCode(query.q);
    else if (query.qType === 'cnic') where.cnicHash = blindIndex(query.q, 'cnic');
    else if (query.qType === 'phone') where.phoneHash = blindIndex(query.q, 'phone');
  }
  return where;
}

export async function listRecords(
  query: AdminRecordsQuery,
): Promise<{ items: AdminRecordRow[]; page: number; pageSize: number; total: number }> {
  const where = buildRecordWhere(query);
  const [rows, total] = await Promise.all([
    prisma.registryPatient.findMany({
      where,
      orderBy: { createdAt: query.order === 'asc' ? 'asc' : 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        trackingCode: true,
        status: true,
        source: true,
        province: true,
        district: true,
        gender: true,
        birthYear: true,
        possibleDuplicate: true,
        createdAt: true,
        diagnoses: { select: { conditionSlug: true }, take: 1 },
      },
    }),
    prisma.registryPatient.count({ where }),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      trackingCode: r.trackingCode,
      status: r.status,
      source: r.source,
      province: r.province,
      district: r.district,
      gender: r.gender,
      birthYear: r.birthYear,
      conditionSlug: r.diagnoses[0]?.conditionSlug ?? 'not-sure',
      possibleDuplicate: r.possibleDuplicate,
      createdAt: r.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
  };
}

/* -------------------------------------------------------------------------- */
/*  Admin: full decrypted record detail + duplicate candidates                */
/* -------------------------------------------------------------------------- */

export type DuplicateCandidate = { id: string; trackingCode: string; status: string };

export async function getAdminRecordDetail(
  id: string,
  ctx: { actorId: string; ip: string | null },
): Promise<{ record: DecryptedRecord; duplicates: DuplicateCandidate[] } | null> {
  const rec = await prisma.registryPatient.findUnique({
    where: { id },
    include: {
      diagnoses: { include: { treatments: true } },
      clinician: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!rec || !isNvarVisible(rec)) return null;

  await writeAudit({
    actorId: ctx.actorId,
    actorRole: 'admin',
    action: AuditAction.RECORD_VIEW_PII,
    entity: 'RegistryPatient',
    entityId: rec.id,
    ip: ctx.ip,
  });

  const duplicates = await prisma.registryPatient.findMany({
    where: {
      AND: [NVAR_VISIBLE, { id: { not: id }, OR: [{ cnicHash: rec.cnicHash }, { phoneHash: rec.phoneHash }] }],
    },
    select: { id: true, trackingCode: true, status: true },
    take: 10,
  });

  return { record: mapDecrypted(rec), duplicates };
}

/* -------------------------------------------------------------------------- */
/*  Admin: status transitions & non-PII updates                               */
/* -------------------------------------------------------------------------- */

function assertTransition(from: string, to: 'VERIFIED' | 'REJECTED' | 'DUPLICATE') {
  const allowed: Record<string, string[]> = {
    VERIFIED: ['PENDING', 'REJECTED'],
    REJECTED: ['PENDING', 'VERIFIED'],
    DUPLICATE: ['PENDING'],
  };
  if (!allowed[to].includes(from)) {
    throw new RegistryApiError(409, 'invalid-transition');
  }
}

export async function applyAdminAction(
  id: string,
  action: AdminActionInput,
  ctx: { adminId: string; ip: string | null },
): Promise<{ status: string }> {
  const current = await prisma.registryPatient.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      centerId: true,
      sharedWithNvar: true,
      diagnoses: { select: { id: true }, take: 1 },
    },
  });
  if (!current || !isNvarVisible(current)) throw new RegistryApiError(404, 'not-found');

  switch (action.action) {
    case 'VERIFY': {
      assertTransition(current.status, 'VERIFIED');
      await prisma.registryPatient.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedById: ctx.adminId },
      });
      await writeAudit({
        actorId: ctx.adminId,
        actorRole: 'admin',
        action: AuditAction.RECORD_VERIFY,
        entity: 'RegistryPatient',
        entityId: id,
        meta: { from: current.status },
        ip: ctx.ip,
      });
      return { status: 'VERIFIED' };
    }
    case 'REJECT': {
      assertTransition(current.status, 'REJECTED');
      await prisma.registryPatient.update({
        where: { id },
        data: {
          status: 'REJECTED',
          publicReason: action.publicReason,
          internalNote: action.internalNote ?? null,
        },
      });
      await writeAudit({
        actorId: ctx.adminId,
        actorRole: 'admin',
        action: AuditAction.RECORD_REJECT,
        entity: 'RegistryPatient',
        entityId: id,
        meta: { from: current.status },
        ip: ctx.ip,
      });
      return { status: 'REJECTED' };
    }
    case 'DUPLICATE': {
      assertTransition(current.status, 'DUPLICATE');
      if (action.canonicalId === id) throw new RegistryApiError(409, 'conflict');
      const canonical = await prisma.registryPatient.findUnique({
        where: { id: action.canonicalId },
        select: { id: true, status: true, centerId: true, sharedWithNvar: true },
      });
      if (!canonical || !isNvarVisible(canonical) || canonical.status === 'DUPLICATE') {
        throw new RegistryApiError(409, 'conflict');
      }
      await prisma.registryPatient.update({
        where: { id },
        data: { status: 'DUPLICATE', duplicateOfId: action.canonicalId },
      });
      await writeAudit({
        actorId: ctx.adminId,
        actorRole: 'admin',
        action: AuditAction.RECORD_DUPLICATE,
        entity: 'RegistryPatient',
        entityId: id,
        meta: { from: current.status, canonicalId: action.canonicalId },
        ip: ctx.ip,
      });
      return { status: 'DUPLICATE' };
    }
    case 'UPDATE': {
      const diagnosisId = current.diagnoses[0]?.id;
      if (diagnosisId) {
        await prisma.registryDiagnosis.update({
          where: { id: diagnosisId },
          data: {
            ...(action.issvaCategory ? { issvaCategory: action.issvaCategory } : {}),
            ...(action.severity ? { severity: action.severity } : {}),
            ...(action.basis ? { basis: action.basis } : {}),
            ...(action.conditionSlug ? { conditionSlug: action.conditionSlug } : {}),
            ...(action.bodySite ? { bodySite: action.bodySite } : {}),
            ...(action.onset ? { onset: action.onset } : {}),
          },
        });
      }
      if (action.internalNote !== undefined) {
        await prisma.registryPatient.update({
          where: { id },
          data: { internalNote: action.internalNote },
        });
      }
      await writeAudit({
        actorId: ctx.adminId,
        actorRole: 'admin',
        action: AuditAction.RECORD_UPDATE,
        entity: 'RegistryPatient',
        entityId: id,
        meta: { fields: Object.keys(action).filter((k) => k !== 'action') },
        ip: ctx.ip,
      });
      return { status: current.status };
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin: clinician approvals                                                */
/* -------------------------------------------------------------------------- */

export type ClinicianRow = {
  id: string;
  name: string;
  email: string;
  pmcNumber: string;
  specialty: string;
  facility: string;
  city: string;
  province: string;
  approved: boolean;
  createdAt: string;
};

export async function listClinicians(
  query: AdminCliniciansQuery,
): Promise<{ items: ClinicianRow[]; page: number; pageSize: number; total: number }> {
  const where: Prisma.ClinicianProfileWhereInput = {};
  if (query.approved) where.approved = query.approved === 'true';

  const [rows, total] = await Promise.all([
    prisma.clinicianProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.clinicianProfile.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.user.name,
      email: r.user.email,
      pmcNumber: decryptField(r.pmcNumber),
      specialty: r.specialty,
      facility: r.facility,
      city: r.city,
      province: r.province,
      approved: r.approved,
      createdAt: r.createdAt.toISOString(),
    })),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
  };
}

export async function setClinicianApproval(
  id: string,
  action: ClinicianActionInput,
  ctx: { adminId: string; ip: string | null },
): Promise<void> {
  const profile = await prisma.clinicianProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!profile) throw new RegistryApiError(404, 'not-found');

  if (action.action === 'APPROVE') {
    await prisma.clinicianProfile.update({
      where: { id },
      data: { approved: true, approvedAt: new Date(), approvedById: ctx.adminId },
    });
    await writeAudit({
      actorId: ctx.adminId,
      actorRole: 'admin',
      action: AuditAction.CLINICIAN_APPROVE,
      entity: 'ClinicianProfile',
      entityId: id,
      meta: { province: profile.province },
      ip: ctx.ip,
    });
    void sendClinicianApproval(profile.user.email, profile.user.name);
  } else {
    // Reject: remove the user account (cascade deletes profile + sessions).
    await prisma.user.delete({ where: { id: profile.user.id } });
    await writeAudit({
      actorId: ctx.adminId,
      actorRole: 'admin',
      action: AuditAction.CLINICIAN_REJECT,
      entity: 'ClinicianProfile',
      entityId: id,
      meta: { province: profile.province },
      ip: ctx.ip,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin: audit log listing                                                  */
/* -------------------------------------------------------------------------- */

export type AuditRow = {
  id: string;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
};

const AUDIT_PAGE_SIZE = 50;

export async function listAudit(
  query: AdminAuditQuery,
): Promise<{ items: AuditRow[]; page: number; pageSize: number; total: number }> {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.actorId) where.actorId = query.actorId;
  if (query.action) where.action = query.action;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      actorName: r.actor?.name ?? null,
      actorEmail: r.actor?.email ?? null,
      actorRole: r.actorRole,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      ip: r.ip,
    })),
    page: query.page,
    pageSize: AUDIT_PAGE_SIZE,
    total,
  };
}

/* -------------------------------------------------------------------------- */
/*  Admin: overview counts                                                    */
/* -------------------------------------------------------------------------- */

export async function getAdminOverview(): Promise<{
  pending: number;
  verified: number;
  rejected: number;
  cliniciansPending: number;
}> {
  const [pending, verified, rejected, cliniciansPending] = await Promise.all([
    prisma.registryPatient.count({ where: { AND: [NVAR_VISIBLE, { status: 'PENDING' }] } }),
    prisma.registryPatient.count({ where: { AND: [NVAR_VISIBLE, { status: 'VERIFIED' }] } }),
    prisma.registryPatient.count({ where: { AND: [NVAR_VISIBLE, { status: 'REJECTED' }] } }),
    prisma.clinicianProfile.count({ where: { approved: false } }),
  ]);
  return { pending, verified, rejected, cliniciansPending };
}

/* -------------------------------------------------------------------------- */
/*  Admin: CSV export (streamed, decrypted row-by-row)                        */
/* -------------------------------------------------------------------------- */

const EXPORT_COLUMNS = [
  'trackingCode', 'status', 'source', 'fullName', 'guardianName', 'cnic', 'phone',
  'altPhone', 'email', 'province', 'district', 'address', 'dob', 'gender', 'isMinor',
  'conditionSlug', 'issvaCategory', 'bodySite', 'onset', 'severity', 'basis', 'facility',
  'treatments', 'consentRegistry', 'consentContact', 'consentResearch', 'consentGuardian',
  'clinicianName', 'clinicianFacility', 'createdAt', 'verifiedAt',
] as const;

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function countExportRows(query: AdminExportQuery): Promise<number> {
  return prisma.registryPatient.count({ where: buildRecordWhere(query) });
}

/** Streams a UTF-8 CSV (BOM for Excel). Decrypts in batches to bound memory. */
export function streamExportCsv(query: AdminExportQuery): ReadableStream<Uint8Array> {
  const where = buildRecordWhere(query);
  const encoder = new TextEncoder();
  const BATCH = 100;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode('﻿' + EXPORT_COLUMNS.join(',') + '\n'));
      let skip = 0;
      try {
        for (;;) {
          const rows = await prisma.registryPatient.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: BATCH,
            include: {
              diagnoses: { include: { treatments: true }, take: 1 },
              clinician: { include: { user: { select: { name: true } } } },
            },
          });
          if (rows.length === 0) break;
          for (const r of rows) {
            const d = r.diagnoses[0];
            const treatments = d
              ? d.treatments.map((tr) => `${tr.type}:${tr.year ?? ''}:${tr.outcome}`).join('|')
              : '';
            const cells: unknown[] = [
              r.trackingCode, r.status, r.source,
              decryptField(r.fullName),
              decryptNullable(r.guardianName) ?? '',
              decryptField(r.cnic), decryptField(r.phone),
              decryptNullable(r.altPhone) ?? '',
              decryptNullable(r.email) ?? '',
              r.province, r.district,
              decryptNullable(r.address) ?? '',
              decryptField(r.dob), r.gender, r.isMinor,
              d?.conditionSlug ?? '', d?.issvaCategory ?? '', d?.bodySite ?? '',
              d?.onset ?? '', d?.severity ?? '', d?.basis ?? '', d?.facility ?? '',
              treatments,
              r.consentRegistry, r.consentContact, r.consentResearch, r.consentGuardian,
              r.clinician?.user.name ?? '', r.clinician?.facility ?? '',
              r.createdAt.toISOString(), r.verifiedAt ? r.verifiedAt.toISOString() : '',
            ];
            controller.enqueue(encoder.encode(cells.map(csvCell).join(',') + '\n'));
          }
          skip += rows.length;
          if (rows.length < BATCH) break;
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
