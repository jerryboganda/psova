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

export const enrollSchema = z
  .object({
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
    consentRegistry: z.literal(true),
    consentContact: z.boolean(),
    consentResearch: z.boolean(),
    consentGuardian: z.boolean(),
    // anti-bot
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => refineDemographics(data, ctx, { requireGuardianConsent: true }));

export type EnrollInput = z.infer<typeof enrollSchema>;

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
