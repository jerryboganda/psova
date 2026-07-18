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
import { sendEnrollmentConfirmation } from './mailer';
import type { CaseInput, CasesQuery, EnrollInput, StatusInput } from './schemas';

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

export async function createEnrollment(
  input: EnrollInput,
  ctx: { ip: string | null },
): Promise<{ trackingCode: string; patientId: string }> {
  const cnicHash = blindIndex(input.cnic, 'cnic');
  const phoneHash = blindIndex(input.phone, 'phone');
  const { year, month, isMinor } = deriveDobParts(input.dob);

  const trackingCode = await generateUniqueTrackingCode(trackingCodeExists);

  // Duplicate detection via blind index — flags, never blocks (PRD A2).
  const dup = await prisma.registryPatient.findFirst({
    where: { OR: [{ cnicHash }, { phoneHash }] },
    select: { id: true },
  });
  const possibleDuplicate = dup !== null;

  const patient = await prisma.$transaction((tx) =>
    tx.registryPatient.create({
      data: {
        trackingCode,
        status: 'PENDING',
        source: 'SELF',
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
    action: AuditAction.ENROLL_SUBMIT,
    entity: 'RegistryPatient',
    entityId: patient.id,
    meta: {
      source: 'SELF',
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

export type PublicStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type StatusResult = {
  status: PublicStatus;
  submittedAt: string;
  firstName: string;
  publicReason?: string;
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
    select: { id: true, status: true, fullName: true, createdAt: true, publicReason: true },
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

export async function createClinicianCase(
  input: CaseInput,
  ctx: { clinicianId: string | null; actorId: string; ip: string | null },
): Promise<{ trackingCode: string; patientId: string }> {
  const cnicHash = blindIndex(input.cnic, 'cnic');
  const phoneHash = blindIndex(input.phone, 'phone');
  const { year, month, isMinor } = deriveDobParts(input.dob);

  const trackingCode = await generateUniqueTrackingCode(trackingCodeExists);

  const dup = await prisma.registryPatient.findFirst({
    where: { OR: [{ cnicHash }, { phoneHash }] },
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
        consentRegistry: true,
        consentContact: false,
        consentResearch: false,
        consentGuardian: isMinor,
        consentVersion: 'v1-clinician',
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
    actorRole: 'clinician',
    action: AuditAction.CASE_SUBMIT,
    entity: 'RegistryPatient',
    entityId: patient.id,
    meta: {
      source: 'CLINICIAN',
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
  opts?: { restrictClinicianId?: string },
): Promise<DecryptedRecord | null> {
  const rec = await prisma.registryPatient.findFirst({
    where: {
      id,
      ...(opts?.restrictClinicianId ? { clinicianId: opts.restrictClinicianId } : {}),
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
