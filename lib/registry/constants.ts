// NVAR shared constants — single source of truth for enum option lists (mirrors
// prisma/schema.prisma enums), curated categorical lists, age bands, and audit
// actions. Bilingual labels for these live in messages/*.json under
// `RegistryCommon` and are rendered ONLY via those keys (never the raw enum).

import { CONDITIONS } from '@/data/conditions';

/* -------------------------------------------------------------------------- */
/*  Enum option tuples (must match the Prisma enums)                          */
/* -------------------------------------------------------------------------- */

export const PROVINCES = [
  'PUNJAB',
  'SINDH',
  'KHYBER_PAKHTUNKHWA',
  'BALOCHISTAN',
  'GILGIT_BALTISTAN',
  'AZAD_JAMMU_KASHMIR',
  'ISLAMABAD_CAPITAL_TERRITORY',
] as const;

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export const ONSETS = [
  'BIRTH',
  'INFANCY',
  'CHILDHOOD',
  'ADOLESCENCE',
  'ADULTHOOD',
  'UNKNOWN',
] as const;

export const ISSVA_CATEGORIES = [
  'BENIGN_TUMOR',
  'BORDERLINE_TUMOR',
  'MALIGNANT_TUMOR',
  'SIMPLE_MALFORMATION',
  'COMBINED_MALFORMATION',
  'MAJOR_VESSEL_ANOMALY',
  'SYNDROMIC',
  'UNCLASSIFIED',
] as const;

export const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'UNKNOWN'] as const;

export const DIAGNOSIS_BASES = ['CLINICAL', 'IMAGING', 'HISTOLOGY', 'UNKNOWN'] as const;

export const TREATMENT_TYPES = [
  'OBSERVATION',
  'PROPRANOLOL',
  'OTHER_MEDICATION',
  'LASER',
  'SCLEROTHERAPY',
  'EMBOLIZATION',
  'SURGERY',
  'COMBINED',
  'OTHER',
] as const;

export const TREATMENT_OUTCOMES = [
  'RESOLVED',
  'IMPROVED',
  'UNCHANGED',
  'WORSENED',
  'ONGOING',
  'UNKNOWN',
] as const;

export const REGISTRY_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'DUPLICATE'] as const;

export const RECORD_SOURCES = ['SELF', 'CLINICIAN'] as const;

/* -------------------------------------------------------------------------- */
/*  Curated categorical lists (non-PII, collected for statistics)             */
/* -------------------------------------------------------------------------- */

/** Affected body region. Labels: RegistryCommon.bodySites.<slug>. */
export const BODY_SITES = [
  'head-neck',
  'face',
  'scalp',
  'eye-periorbital',
  'lip-mouth',
  'trunk',
  'back',
  'chest',
  'abdomen',
  'pelvis-genital',
  'upper-limb',
  'hand',
  'lower-limb',
  'foot',
  'multiple',
  'internal',
  'other',
] as const;

/** "Diagnosed by a doctor?" answers for self-enrollment. */
export const DOCTOR_DIAGNOSED = ['yes', 'no', 'unsure'] as const;

/**
 * Condition slugs come from the site content in data/conditions.ts so the
 * registry stays in lock-step with the public condition library, plus the two
 * catch-all options families/clinicians may pick.
 */
export const CONDITION_SLUGS = CONDITIONS.map((c) => c.slug) as [string, ...string[]];

export const CONDITION_SLUG_OPTIONS = [...CONDITION_SLUGS, 'other', 'not-sure'] as [
  string,
  ...string[],
];

/* -------------------------------------------------------------------------- */
/*  Age bands (computed from birthYear at query time; labels via message keys) */
/* -------------------------------------------------------------------------- */

export type AgeBand = { key: string; min: number; max: number };

/** Coarse bands (DATA-MODEL §5). Labels: RegistryCommon.ageBands.<key>. */
export const AGE_BANDS: readonly AgeBand[] = [
  { key: 'under1', min: 0, max: 0 },
  { key: 'age1to4', min: 1, max: 4 },
  { key: 'age5to9', min: 5, max: 9 },
  { key: 'age10to14', min: 10, max: 14 },
  { key: 'age15to19', min: 15, max: 19 },
  { key: 'age20to29', min: 20, max: 29 },
  { key: 'age30to49', min: 30, max: 49 },
  { key: 'age50plus', min: 50, max: Number.POSITIVE_INFINITY },
] as const;

/** Bucket an integer age into an AGE_BANDS key. */
export function ageBandKey(age: number): string {
  const band = AGE_BANDS.find((b) => age >= b.min && age <= b.max);
  return band ? band.key : 'age50plus';
}

/* -------------------------------------------------------------------------- */
/*  Statistics / disclosure control                                           */
/* -------------------------------------------------------------------------- */

/** Below this VERIFIED total the public dashboard shows "collection in progress". */
export const STATS_PUBLISH_THRESHOLD = 25;

/** k-anonymity: any aggregate cell strictly below this count is suppressed. */
export const K_ANON_MIN = 5;

/* -------------------------------------------------------------------------- */
/*  Audit actions (DATA-MODEL §3)                                             */
/* -------------------------------------------------------------------------- */

export const AuditAction = {
  ENROLL_SUBMIT: 'ENROLL_SUBMIT',
  CASE_SUBMIT: 'CASE_SUBMIT',
  STATUS_LOOKUP: 'STATUS_LOOKUP',
  RECORD_VIEW_PII: 'RECORD_VIEW_PII',
  RECORD_VERIFY: 'RECORD_VERIFY',
  RECORD_REJECT: 'RECORD_REJECT',
  RECORD_DUPLICATE: 'RECORD_DUPLICATE',
  RECORD_UPDATE: 'RECORD_UPDATE',
  EXPORT_CSV: 'EXPORT_CSV',
  CLINICIAN_REGISTER: 'CLINICIAN_REGISTER',
  CLINICIAN_APPROVE: 'CLINICIAN_APPROVE',
  CLINICIAN_REJECT: 'CLINICIAN_REJECT',
  ADMIN_SEEDED: 'ADMIN_SEEDED',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/** Actor role snapshot stored on each audit row. */
export const ACTOR_ROLES = ['admin', 'clinician', 'public', 'system'] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

/* -------------------------------------------------------------------------- */
/*  Handy inferred union types                                                */
/* -------------------------------------------------------------------------- */

export type ProvinceValue = (typeof PROVINCES)[number];
export type GenderValue = (typeof GENDERS)[number];
export type OnsetValue = (typeof ONSETS)[number];
export type IssvaValue = (typeof ISSVA_CATEGORIES)[number];
export type SeverityValue = (typeof SEVERITIES)[number];
export type DiagnosisBasisValue = (typeof DIAGNOSIS_BASES)[number];
export type TreatmentTypeValue = (typeof TREATMENT_TYPES)[number];
export type TreatmentOutcomeValue = (typeof TREATMENT_OUTCOMES)[number];
export type RegistryStatusValue = (typeof REGISTRY_STATUSES)[number];
export type RecordSourceValue = (typeof RECORD_SOURCES)[number];
export type BodySiteValue = (typeof BODY_SITES)[number];
