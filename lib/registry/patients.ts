// Registry domain service. Server-only (imports crypto). Encapsulates the
// encrypt → hash → transaction → audit flow so routes stay thin (ARCHITECTURE §3).
// P3 scope: createEnrollment, statusLookup. Later phases add clinician/admin ops.

import { prisma } from './db';
import {
  encryptField,
  encryptNullable,
  decryptField,
  blindIndex,
} from './crypto';
import { deriveDobParts } from './normalize';
import { generateUniqueTrackingCode, normalizeTrackingCode } from './codes';
import { writeAudit } from './audit';
import { AuditAction } from './constants';
import { sendEnrollmentConfirmation } from './mailer';
import type { EnrollInput, StatusInput } from './schemas';

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
