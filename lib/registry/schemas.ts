// ALL registry Zod schemas — single source, shared client + server (API-SPEC).
// MUST stay free of node:crypto / Prisma so client wizards can import it.

import { z } from 'zod';
import {
  PROVINCES,
  GENDERS,
  ONSETS,
  ISSVA_CATEGORIES,
  SEVERITIES,
  DIAGNOSIS_BASES,
  TREATMENT_TYPES,
  TREATMENT_OUTCOMES,
  BODY_SITES,
  DOCTOR_DIAGNOSED,
  CONDITION_SLUG_OPTIONS,
  REGISTRY_STATUSES,
  RECORD_SOURCES,
  CONDITION_SLUGS,
  CENTER_TYPES,
  CENTER_STATUSES,
  CENTER_TIERS,
  CENTER_SERVICES,
  CENTER_PAYMENT_METHODS,
  CENTER_PAYMENT_STATUSES,
  CENTER_STAFF_ROLES,
  APPOINTMENT_KINDS,
  RESPONSE_SCORES,
  DOCUMENT_KINDS,
} from './constants';
import { isValidCnic, isValidPkMobile, isPlausibleDob, deriveDobParts } from './normalize';

const CURRENT_YEAR = new Date().getFullYear();

/* -------------------------------------------------------------------------- */
/*  Shared demographic validation                                             */
/* -------------------------------------------------------------------------- */

type DemographicLike = {
  dob: string;
  cnic: string;
  phone: string;
  altPhone?: string;
  guardianName?: string;
  conditionSlug: string;
  conditionOther?: string;
  consentGuardian?: boolean;
};

function refineDemographics(
  data: DemographicLike,
  ctx: z.RefinementCtx,
  opts: { requireGuardianConsent: boolean },
): void {
  if (!isPlausibleDob(data.dob)) {
    ctx.addIssue({ code: 'custom', path: ['dob'], message: 'Enter a valid date of birth.' });
    return; // cannot derive age reliably
  }
  if (!isValidCnic(data.cnic)) {
    ctx.addIssue({ code: 'custom', path: ['cnic'], message: 'CNIC must be 13 digits.' });
  }
  if (!isValidPkMobile(data.phone)) {
    ctx.addIssue({
      code: 'custom',
      path: ['phone'],
      message: 'Enter a valid Pakistani mobile number.',
    });
  }
  if (data.altPhone && data.altPhone.trim() !== '' && !isValidPkMobile(data.altPhone)) {
    ctx.addIssue({
      code: 'custom',
      path: ['altPhone'],
      message: 'Enter a valid Pakistani mobile number.',
    });
  }
  const { isMinor } = deriveDobParts(data.dob);
  if (isMinor && (!data.guardianName || data.guardianName.trim().length < 3)) {
    ctx.addIssue({
      code: 'custom',
      path: ['guardianName'],
      message: 'Guardian name is required for a minor.',
    });
  }
  if (opts.requireGuardianConsent && isMinor && data.consentGuardian !== true) {
    ctx.addIssue({
      code: 'custom',
      path: ['consentGuardian'],
      message: 'Guardian declaration is required for a minor.',
    });
  }
  if (data.conditionSlug === 'other' && (!data.conditionOther || data.conditionOther.trim() === '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['conditionOther'],
      message: 'Please describe the condition.',
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Public enrollment (POST /api/registry/enroll)                             */
/* -------------------------------------------------------------------------- */

const enrollBase = z.object({
    // step 1 — patient
    fullName: z.string().min(3).max(120),
    gender: z.enum(GENDERS),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guardianName: z.string().min(3).max(120).optional(),
    // step 2 — contact
    phone: z.string(),
    altPhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    cnic: z.string(),
    province: z.enum(PROVINCES),
    district: z.string().min(2).max(80),
    address: z.string().max(300).optional(),
    // step 3 — condition
    conditionSlug: z.enum(CONDITION_SLUG_OPTIONS),
    conditionOther: z.string().max(120).optional(),
    bodySite: z.enum(BODY_SITES),
    onset: z.enum(ONSETS),
    doctorDiagnosed: z.enum(DOCTOR_DIAGNOSED),
    facility: z.string().max(160).optional(),
    treatmentNotes: z.string().max(2000).optional(),
    // step 4 — consent
    consentRegistry: z.boolean(),
    consentCentre: z.boolean().optional(), // centre QR intake only
    consentContact: z.boolean(),
    consentResearch: z.boolean(),
    consentGuardian: z.boolean(),
    // anti-bot
    website: z.string().max(0).optional(),
  });

export const enrollSchema = enrollBase
  .extend({ consentRegistry: z.literal(true) })
  .superRefine((data, ctx) => refineDemographics(data, ctx, { requireGuardianConsent: true }));

export type EnrollInput = z.infer<typeof enrollSchema>;

/**
 * Patient registering through a centre's QR code (POST /api/centres/intake/[slug]).
 * Consent to the centre is required; consent to NVAR is the patient's own choice.
 */
export const centreIntakeSchema = enrollBase
  .extend({ consentCentre: z.literal(true) })
  .superRefine((data, ctx) => refineDemographics(data, ctx, { requireGuardianConsent: true }));

export type CentreIntakeInput = z.infer<typeof centreIntakeSchema>;

/* -------------------------------------------------------------------------- */
/*  Status lookup (POST /api/registry/status)                                 */
/* -------------------------------------------------------------------------- */

export const statusSchema = z.object({
  trackingCode: z.string().min(1).max(40),
  phone: z.string().min(1).max(40),
});
export type StatusInput = z.infer<typeof statusSchema>;

/* -------------------------------------------------------------------------- */
/*  Clinician registration (POST /api/registry/clinicians/register)          */
/* -------------------------------------------------------------------------- */

export const clinicianRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(128),
  pmcNumber: z.string().min(4).max(30),
  specialty: z.string().min(2).max(80),
  facility: z.string().min(2).max(160),
  city: z.string().min(2).max(80),
  province: z.enum(PROVINCES),
  website: z.string().max(0).optional(),
});
export type ClinicianRegisterInput = z.infer<typeof clinicianRegisterSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/*  Clinician case (POST /api/registry/cases)                                 */
/*  Steps 1–2 demographics + diagnosis fields. Condition slug + body site are  */
/*  required by DATA-MODEL, so they are included alongside the clinical fields */
/*  named in API-SPEC §3 (reconciles API-SPEC with PRD B2 / DATA-MODEL).       */
/* -------------------------------------------------------------------------- */

export const treatmentSchema = z.object({
  type: z.enum(TREATMENT_TYPES),
  facility: z.string().max(160).optional(),
  year: z.number().int().min(1950).max(CURRENT_YEAR).optional(),
  outcome: z.enum(TREATMENT_OUTCOMES),
});
export type TreatmentInput = z.infer<typeof treatmentSchema>;

export const caseSchema = z
  .object({
    // demographics + contact (enroll steps 1–2)
    fullName: z.string().min(3).max(120),
    gender: z.enum(GENDERS),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guardianName: z.string().min(3).max(120).optional(),
    phone: z.string(),
    altPhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    cnic: z.string(),
    province: z.enum(PROVINCES),
    district: z.string().min(2).max(80),
    address: z.string().max(300).optional(),
    // diagnosis
    conditionSlug: z.enum(CONDITION_SLUG_OPTIONS),
    conditionOther: z.string().max(120).optional(),
    bodySite: z.enum(BODY_SITES),
    onset: z.enum(ONSETS),
    issvaCategory: z.enum(ISSVA_CATEGORIES),
    severity: z.enum(SEVERITIES),
    basis: z.enum(DIAGNOSIS_BASES),
    facility: z.string().max(160).optional(),
    clinicalNotes: z.string().max(4000).optional(),
    treatments: z.array(treatmentSchema).max(10).default([]),
    // clinician attests patient consent
    consentAttested: z.literal(true),
    // centre staff only: the centre's own patient number (ignored by the NVAR clinician flow)
    mrn: z.string().trim().max(40).optional(),
  })
  .superRefine((data, ctx) => refineDemographics(data, ctx, { requireGuardianConsent: false }));

export type CaseInput = z.infer<typeof caseSchema>;

/* -------------------------------------------------------------------------- */
/*  Admin actions (PATCH /api/registry/admin/records/[id])                    */
/* -------------------------------------------------------------------------- */

export const adminActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('VERIFY') }),
  z.object({
    action: z.literal('REJECT'),
    publicReason: z.string().min(5).max(500),
    internalNote: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal('DUPLICATE'),
    canonicalId: z.string().min(1),
  }),
  z.object({
    action: z.literal('UPDATE'),
    issvaCategory: z.enum(ISSVA_CATEGORIES).optional(),
    severity: z.enum(SEVERITIES).optional(),
    basis: z.enum(DIAGNOSIS_BASES).optional(),
    conditionSlug: z.enum(CONDITION_SLUG_OPTIONS).optional(),
    bodySite: z.enum(BODY_SITES).optional(),
    onset: z.enum(ONSETS).optional(),
    internalNote: z.string().max(1000).optional(),
  }),
]);
export type AdminActionInput = z.infer<typeof adminActionSchema>;

export const clinicianActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});
export type ClinicianActionInput = z.infer<typeof clinicianActionSchema>;

/* -------------------------------------------------------------------------- */
/*  List / query schemas (GET routes; values come from query strings)         */
/* -------------------------------------------------------------------------- */

const BOOLISH = z.enum(['true', 'false']);

export const adminRecordsQuerySchema = z.object({
  status: z.enum(REGISTRY_STATUSES).optional(),
  province: z.enum(PROVINCES).optional(),
  conditionSlug: z.string().max(80).optional(),
  source: z.enum(RECORD_SOURCES).optional(),
  possibleDuplicate: BOOLISH.optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  q: z.string().max(120).optional(),
  qType: z.enum(['cnic', 'phone', 'code']).optional(),
  order: z.enum(['asc', 'desc']).optional(), // queue uses 'asc' (oldest first)
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminRecordsQuery = z.infer<typeof adminRecordsQuerySchema>;

export const adminCliniciansQuerySchema = z.object({
  approved: BOOLISH.optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminCliniciansQuery = z.infer<typeof adminCliniciansQuerySchema>;

export const adminAuditQuerySchema = z.object({
  actorId: z.string().max(60).optional(),
  action: z.string().max(60).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;

export const adminExportQuerySchema = z.object({
  status: z.enum(REGISTRY_STATUSES).optional(),
  province: z.enum(PROVINCES).optional(),
  conditionSlug: z.string().max(80).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
});
export type AdminExportQuery = z.infer<typeof adminExportQuerySchema>;

export const casesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(REGISTRY_STATUSES).optional(),
});
export type CasesQuery = z.infer<typeof casesQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Centres network (docs/centres/PLAN.md)                                    */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Manual-payment proof typed by the centre; an admin checks it against the bank/wallet. */
export const centerPaymentProofSchema = z
  .object({
    method: z.enum(CENTER_PAYMENT_METHODS),
    txnRef: z.string().trim().min(4).max(60),
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((data, ctx) => {
    const t = Date.parse(data.paidOn);
    const now = Date.now();
    if (Number.isNaN(t) || t > now + DAY_MS || t < now - 400 * DAY_MS) {
      ctx.addIssue({ code: 'custom', path: ['paidOn'], message: 'Enter the payment date.' });
    }
  });
export type CenterPaymentProofInput = z.infer<typeof centerPaymentProofSchema>;

export const centerApplySchema = z.object({
  // owner account
  ownerName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(128),
  // centre
  nameEn: z.string().trim().min(3).max(160),
  nameUr: z.string().trim().max(160).optional(),
  type: z.enum(CENTER_TYPES),
  city: z.string().trim().min(2).max(80),
  province: z.enum(PROVINCES),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/),
  contactEmail: z.string().email(),
  websiteUrl: z.string().url().max(200).optional().or(z.literal('')),
  services: z.array(z.enum(CENTER_SERVICES)).min(1).max(CENTER_SERVICES.length),
  conditions: z.array(z.enum(CONDITION_SLUGS)).min(1).max(CONDITION_SLUGS.length),
  // credentials
  licenceNumber: z.string().trim().min(3).max(60),
  headDoctorName: z.string().trim().min(3).max(120),
  headDoctorPmc: z.string().trim().min(4).max(30),
  // optional first-year payment proof (can also be submitted later from the dashboard)
  payment: centerPaymentProofSchema.optional(),
  consentTerms: z.literal(true),
  // anti-bot
  website: z.string().max(0).optional(),
});
export type CenterApplyInput = z.infer<typeof centerApplySchema>;

const PK_LAT = z.number().min(23).max(37.5);
const PK_LNG = z.number().min(60).max(77.5);

export const centerActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('APPROVE'),
    tier: z.enum(CENTER_TIERS).optional(),
    lat: PK_LAT.optional(),
    lng: PK_LNG.optional(),
  }),
  z.object({ action: z.literal('REJECT'), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal('SUSPEND'), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal('REINSTATE') }),
  z.object({ action: z.literal('SET_TIER'), tier: z.enum(CENTER_TIERS) }),
  z.object({ action: z.literal('EXTEND'), days: z.number().int().min(1).max(366) }),
]);
export type CenterActionInput = z.infer<typeof centerActionSchema>;

export const centerPaymentActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('VERIFY') }),
  z.object({ action: z.literal('REJECT'), reason: z.string().trim().min(5).max(300) }),
]);
export type CenterPaymentActionInput = z.infer<typeof centerPaymentActionSchema>;

export const adminCentersQuerySchema = z.object({
  status: z.enum(CENTER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminCentersQuery = z.infer<typeof adminCentersQuerySchema>;

export const adminCenterPaymentsQuerySchema = z.object({
  status: z.enum(CENTER_PAYMENT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminCenterPaymentsQuery = z.infer<typeof adminCenterPaymentsQuerySchema>;

export const staffInviteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  role: z.enum(CENTER_STAFF_ROLES),
});
export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

export const staffUpdateSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SET_ROLE'), role: z.enum(CENTER_STAFF_ROLES) }),
  z.object({ action: z.literal('DEACTIVATE') }),
  z.object({ action: z.literal('REACTIVATE') }),
  z.object({ action: z.literal('RESEND') }),
]);
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

/** What a centre owner may edit. Name, licence and head-doctor credentials stay PSOVA-controlled. */
export const centerProfileSchema = z.object({
  nameUr: z.string().trim().max(160).optional(),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/),
  contactEmail: z.string().email(),
  websiteUrl: z.string().url().max(200).optional().or(z.literal('')),
  services: z.array(z.enum(CENTER_SERVICES)).min(1).max(CENTER_SERVICES.length),
  conditions: z.array(z.enum(CONDITION_SLUGS)).min(1).max(CONDITION_SLUGS.length),
});
export type CenterProfileInput = z.infer<typeof centerProfileSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(10).max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match.' });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* -------------------------------------------------------------------------- */
/*  Centre patient journey: appointments and visits                           */
/* -------------------------------------------------------------------------- */

const isoInstant = z.string().datetime({ offset: true });
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1).max(40),
  startsAt: isoInstant,
  kind: z.enum(APPOINTMENT_KINDS),
  note: z.string().trim().max(500).optional(),
});
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('STATUS'), status: z.enum(['SCHEDULED', 'DONE', 'MISSED', 'CANCELLED']) }),
  z.object({ action: z.literal('RESCHEDULE'), startsAt: isoInstant }),
]);
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

export const encounterCreateSchema = z
  .object({
    date: dateOnly,
    notes: z.string().trim().max(4000).optional(),
    lesionSizeCm: z.number().min(0).max(200).optional(),
    painScore: z.number().int().min(0).max(10).optional(),
    responseScore: z.enum(RESPONSE_SCORES).optional(),
    // doctor-only (enforced server-side): the plan and any treatment given at this visit
    plan: z.string().trim().max(2000).optional(),
    nextReviewDate: dateOnly.optional(),
    treatment: z
      .object({
        type: z.enum(TREATMENT_TYPES),
        drug: z.string().trim().max(120).optional(),
        dose: z.string().trim().max(120).optional(),
        outcome: z.enum(TREATMENT_OUTCOMES),
        complications: z.string().trim().max(1000).optional(),
      })
      .optional(),
  })
  .superRefine((d, ctx) => {
    const t = Date.parse(d.date);
    const now = Date.now();
    if (Number.isNaN(t) || t > now + 24 * 60 * 60 * 1000 || t < Date.parse('1950-01-01')) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Enter the visit date.' });
    }
    if (d.nextReviewDate && Date.parse(d.nextReviewDate) < t) {
      ctx.addIssue({ code: 'custom', path: ['nextReviewDate'], message: 'The review must be after the visit.' });
    }
  });
export type EncounterCreateInput = z.infer<typeof encounterCreateSchema>;

/** The non-file fields of an upload (multipart form). */
export const documentUploadSchema = z.object({
  kind: z.enum(DOCUMENT_KINDS),
  consentForTeaching: z.boolean(),
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
