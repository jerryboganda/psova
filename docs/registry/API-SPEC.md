# API-SPEC — NVAR Endpoints

All routes return the envelope: success `{ ok: true, ... }`, failure
`{ ok: false, error: "<machine-code>" }`. Zod schemas live in `lib/registry/schemas.ts`
(single source, shared client+server). Auth = Better Auth session cookie.
Origin check (SECURITY §5.6) on all mutating routes. IPs from first `x-forwarded-for` hop.

Machine error codes: `validation` (400) · `unauthorized` (401) · `forbidden` (403) ·
`not-found` (404) · `conflict`/`invalid-transition` (409) · `payload-too-large` (413) ·
`rate-limited` (429) · `server-error` (500).

---

## 1. Auth

### `ALL /api/auth/[...all]` — Better Auth handler
`toNextJsHandler(auth)` — login, logout, session. Email/password only. Signup via §2 wrapper
only (Better Auth's raw signup is fine to keep enabled; role field is non-writable by input).

### `POST /api/registry/clinicians/register` — clinician self-registration
Rate limit 10/h/IP.
```ts
clinicianRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(128),
  pmcNumber: z.string().min(4).max(30),         // 🔐 + blind index
  specialty: z.string().min(2).max(80),
  facility: z.string().min(2).max(160),
  city: z.string().min(2).max(80),
  province: z.enum(PROVINCES),
  website: z.string().max(0).optional(),        // honeypot
})
```
Flow: honeypot → `auth.api.signUpEmail` → create `ClinicianProfile(approved:false,
pmcNumber: encrypted, pmcHash)` in transaction → audit `CLINICIAN_REGISTER`.
Duplicate `pmcHash` → still create, audit meta `possibleDuplicatePmc: true`.
201 `{ ok: true }` (session cookie set; UI shows pending-approval screen).

## 2. Public registry

### `POST /api/registry/enroll` — patient self-enrollment
Rate limit 5/h/IP. Body ≤ 50 KB.
```ts
enrollSchema = z.object({
  // step 1
  fullName: z.string().min(3).max(120),
  gender: z.enum(['MALE','FEMALE','OTHER']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),   // not in future; not >120y ago (superRefine)
  guardianName: z.string().min(3).max(120).optional(),
  // step 2
  phone: z.string(),                               // normalized+validated PK mobile (superRefine)
  altPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  cnic: z.string(),                                // 13 digits after normalize (superRefine)
  province: z.enum(PROVINCES),
  district: z.string().min(2).max(80),
  address: z.string().max(300).optional(),
  // step 3
  conditionSlug: z.enum([...CONDITION_SLUGS, 'other', 'not-sure']),
  conditionOther: z.string().max(120).optional(),
  bodySite: z.enum(BODY_SITES),
  onset: z.enum(ONSETS),
  doctorDiagnosed: z.enum(['yes','no','unsure']),
  facility: z.string().max(160).optional(),
  treatmentNotes: z.string().max(2000).optional(), // → Diagnosis.notes 🔐
  // step 4
  consentRegistry: z.literal(true),
  consentContact: z.boolean(),
  consentResearch: z.boolean(),
  consentGuardian: z.boolean(),                    // required true when minor (superRefine)
  website: z.string().max(0).optional(),           // honeypot
})
```
superRefine: minor (age<18) ⇒ `guardianName` + `consentGuardian:true` required.
Flow: ARCHITECTURE §3.1. Honeypot ⇒ fake `201 { ok:true, trackingCode: <fake code> }`.
201 `{ ok: true, trackingCode: "PSV-A7K2-9MQ4" }`.

### `POST /api/registry/status` — tracking lookup
Rate limit 10/h/IP.
```ts
statusSchema = z.object({ trackingCode: z.string(), phone: z.string() })
```
Match: normalize code (uppercase, reinsert dashes) → find by `trackingCode` →
compare `phoneHash`. No match (either) → 404 `not-found` (uniform). Audit `STATUS_LOOKUP`
(meta: found boolean only).
200:
```ts
{ ok: true, status: 'PENDING'|'VERIFIED'|'REJECTED'|'DUPLICATE',
  submittedAt: string, firstName: string,            // first token of decrypted fullName only
  publicReason?: string }                            // only when REJECTED
```
(DUPLICATE presents as VERIFIED to the public — same family, merged record.)

### `GET /api/registry/stats` — public aggregates
`export const revalidate = 3600`. No params (v1 fixed breakdowns).
200:
```ts
{ ok: true, published: boolean,          // false until VERIFIED total ≥ 25
  totals: { verified: number, provinces: number, clinicians: number, conditions: number },
  byProvince: { province: Province, count: number|null }[],     // null = suppressed <5
  byCondition: { slug: string, count: number|null }[],
  byGender: { gender: Gender, count: number|null }[],
  byAgeBand: { band: string, count: number|null }[],
  byYear: { year: number, count: number|null }[],               // enrollment year
  updatedAt: string }
```

## 3. Clinician (guard: session + role ∈ {clinician, admin} + approved)

### `POST /api/registry/cases` — submit clinical case
`caseSchema` = enrollSchema steps 1–2 fields **plus**:
```ts
{ issvaCategory: z.enum(ISSVA_CATEGORIES),
  severity: z.enum(SEVERITIES),
  basis: z.enum(DIAGNOSIS_BASES),
  clinicalNotes: z.string().max(4000).optional(),        // 🔐
  treatments: z.array(z.object({
    type: z.enum(TREATMENT_TYPES),
    facility: z.string().max(160).optional(),
    year: z.number().int().min(1950).max(currentYear).optional(),
    outcome: z.enum(TREATMENT_OUTCOMES),
  })).max(10).default([]),
  consentAttested: z.literal(true), }                    // clinician attests patient consent
```
(consent booleans recorded from attestation; `doctorDiagnosed:'yes'`.)
Creates patient `source: CLINICIAN`, `clinicianId` = caller profile, status PENDING.
Audit `CASE_SUBMIT`. 201 `{ ok: true, trackingCode }`.

### `GET /api/registry/cases?page=&status=` — own cases
Paginated 20/page, `where: { clinicianId: me }`. Rows: id, trackingCode, firstName
(decrypted first token), conditionSlug, status, createdAt. Detail reuse: clinician may GET
`/api/registry/cases/[id]` (own record only → 404 otherwise) — full decrypted view, audit
`RECORD_VIEW_PII` (actorRole clinician).

## 4. Admin (guard: role admin)

### `GET /api/registry/admin/records`
Query: `status?, province?, conditionSlug?, source?, possibleDuplicate?, from?, to?,
q?, qType? ('cnic'|'phone'|'code'), page?`.
`q` search: code → exact `trackingCode`; cnic/phone → blind-index equality. List rows are
metadata-only (NO decrypted fields): id, trackingCode, status, source, province, district,
gender, birthYear, conditionSlug, possibleDuplicate, createdAt. 20/page + total.

### `GET /api/registry/admin/records/[id]`
Full decrypted record + diagnoses + treatments + clinician + duplicate candidates
(same cnicHash or phoneHash, other ids). Audits `RECORD_VIEW_PII`.

### `PATCH /api/registry/admin/records/[id]`
```ts
adminActionSchema = z.discriminatedUnion('action', [
  { action: 'VERIFY' },
  { action: 'REJECT', publicReason: z.string().min(5).max(500), internalNote: z.string().max(1000).optional() },
  { action: 'DUPLICATE', canonicalId: z.string() },      // must exist, not self, not DUPLICATE
  { action: 'UPDATE', /* non-PII clinical fields only: issvaCategory?, severity?, basis?,
      conditionSlug?, bodySite?, onset?, internalNote? */ },
])
```
Transition rules per DATA-MODEL §6 → 409 `invalid-transition`. Sets verifiedAt/verifiedById.
Audits `RECORD_VERIFY|RECORD_REJECT|RECORD_DUPLICATE|RECORD_UPDATE`.

### `GET /api/registry/admin/clinicians?approved=&page=` / `PATCH /api/registry/admin/clinicians/[id]`
PATCH `{ action: 'APPROVE' | 'REJECT' }`. Approve: `approved:true, approvedAt, approvedById`,
audit `CLINICIAN_APPROVE`, send approval email (best-effort). Reject: delete User (cascade)
after confirm, audit `CLINICIAN_REJECT`. GET detail includes decrypted pmcNumber (admin).

### `GET /api/registry/admin/export?status=&province=&conditionSlug=&from=&to=`
Streams `text/csv; charset=utf-8` (BOM for Excel), filename
`psova-registry-export-<yyyymmdd>.csv`. Columns: trackingCode, status, source, fullName,
guardianName, cnic, phone, altPhone, email, province, district, address, dob, gender,
isMinor, conditionSlug, issvaCategory, bodySite, onset, severity, basis, facility,
treatments (joined `type:year:outcome|…`), consent flags, clinician name/facility,
createdAt, verifiedAt. Decrypt row-by-row (chunked, avoid loading all in memory).
Audits `EXPORT_CSV` meta `{ rows, filters }` BEFORE streaming.

### `GET /api/registry/admin/audit?actorId=&action=&from=&to=&page=`
Read-only, 50/page, joined actor name/email.

## 5. Shared implementation notes

- Guards: `requireSession()`, `requireApprovedClinician()`, `requireAdmin()` in
  `lib/registry/guards.ts` — return typed session or throw `RegistryApiError(status, code)`;
  route handlers catch → envelope.
- Pagination envelope: `{ ok, items, page, pageSize, total }`.
- All dates ISO-8601 UTC in JSON.
- Rate limiter: `limit(bucket, ip, max, windowMs)` → boolean; on false return 429 with
  `Retry-After` seconds header.
- Every route: `export const runtime = 'nodejs'` (crypto module requirement; default is fine
  but be explicit on registry routes).
