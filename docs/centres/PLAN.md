# PSOVA Centres Network — Plan

## Context
PSOVA wants to become the hub for vascular-anomaly care in Pakistan. Clinics and hospitals apply to join and pay **PKR 12,000 per year** (shown as PKR 1,000/month, billed annually). Once PSOVA approves a centre, it appears in the public directory and map as a **PSOVA Registered Centre**, on the website and in the mobile app.

Each centre gets a free hosted dashboard for its whole patient journey, so it never has to build or host its own system. **The centre owns its data.** Case by case, it chooses to share with **NVAR** (the national registry) or with **another centre** for a referral or second opinion. The network also makes money (fees now, and a support fund that sponsors can pay into) and builds national data.

What exists today (from exploration):
- NVAR registry: Prisma `RegistryPatient`, `RegistryDiagnosis` and `RegistryTreatment`, encrypted PII, tracking codes, Better Auth roles `admin`/`clinician`, and guards in `lib/registry/guards.ts`.
- The public directory is a **static** list (`packages/content/src/centers.ts`, type `CareCenter`). It feeds `DirectoryExplorer`, `PakistanMap`, `MapTeaser` and the mobile snapshot.
- The mobile app is a Vite PWA served from the **same origin** at `psova.org.pk/app/`. It has no auth and gets its content from `/api/v1/content/snapshot`.
- There is no centre model, no visits or appointments, no uploads and no payment gateway. `PAYMENT_METHODS` holds manual bank/JazzCash/Easypaisa instructions with placeholder account numbers.

## Decisions (from the owner)
- **Payments:** the centre pays manually (bank, JazzCash, Easypaisa or Raast) and enters the transaction ID. A PSOVA admin checks it and activates the membership.
- **Membership expiry:** a reminder 30 days before, then 30 days of grace. After that the centre is hidden from the directory and its dashboard becomes read-only. Data is never deleted.
- **Data ownership:** the centre owns its data, with an opt-in share per case to NVAR and/or to a specific centre.
- **Staff:** an Owner invites staff with roles **Owner / Doctor / Nurse / Reception**.
- **Patients:** they register themselves through the centre's QR code or link. They get a tracking code and no account. Staff can also add patients.
- **Messages:** shown on screen, sent by email, plus a **"Send on WhatsApp"** button. The button opens `https://wa.me/<number>?text=<template>` in WhatsApp Web, and staff press send themselves. No API, no cost.
- **Files:** photos and reports are stored on the **Hostinger disk**, encrypted, outside the deploy folder.
- **v1 features:** appointments and follow-ups, visits, treatments and outcomes, referrals and shares, uploads, **tiers and badges, a case discussion board (MDT), and a patient support fund**.
- **Mobile app:** the dashboard is built once as responsive web pages, and the app opens them with the same login. The app also gets live registered centres, the application form and a status-by-code screen.
- **Not in v1:** the lab and pharma partner portal (it can be added later on the same tier and payment pattern), patient accounts, a payment gateway and a WhatsApp API.

## Data model (`prisma/schema.prisma`, one migration per phase)
Reuse the NVAR patient tables instead of creating parallel ones:
- **`RegistryPatient`** gains `centerId String?`, `sharedWithNvar Boolean @default(false)`, `sharedAt` and `mrn String?` (the centre's local number). Existing NVAR admin queries add the filter `OR: [{centerId: null}, {sharedWithNvar: true}]`, so unshared centre cases never show in NVAR or the stats.
- **`RegistryTreatment`** gains `date`, `drug`/`dose`, `complications` and `encounterId?`.

New models:
- **`Center`**: `slug` (unique), bilingual `nameEn`/`nameUr`, `type` (public/private/trust), `city`, `province`, `address`, public `phone`/`email`/`website`, `lat`/`lng`, `services Json`, `conditions Json`, licence/registration number, head doctor's PMC number (encrypted, with hash), `status` (APPLIED/APPROVED/REJECTED/SUSPENDED), `tier` (MEMBER/ACCREDITED/EXCELLENCE), `membershipExpiresAt` and `approvedById`.
- **`CenterMember`**: `centerId`, `userId` (unique), `role` (OWNER/DOCTOR/NURSE/RECEPTION) and `active`. `User.role` gains the value `'center'` (it is a plain string, so no enum migration).
- **`CenterPayment`**: `centerId`, `amount` (12000), `method`, `txnRef`, `paidOn`, `periodStart`/`periodEnd`, `status` (PENDING/VERIFIED/REJECTED) and `verifiedById`.
- **`Appointment`**: `patientId`, `centerId`, `startsAt`, `kind` (first visit / follow-up / procedure), `status` (SCHEDULED/DONE/MISSED/CANCELLED) and encrypted `note`.
- **`Encounter`** (a visit): `patientId`, `centerId`, `authorUserId`, `date`, encrypted `notes`, `lesionSizeCm`, `painScore 0–10`, `responseScore` (worse/stable/partial/complete), `plan` and `nextReviewDate`. Saving one can auto-create the follow-up appointment.
- **`PatientDocument`**: `patientId`, `centerId`, `kind` (PHOTO/REPORT/IMAGING/OTHER), `fileName`, `mime`, `size`, `storageKey`, `uploadedById`, `consentForTeaching Boolean`.
- **`CaseShare`**: `patientId`, `fromCenterId`, `toCenterId`, `type` (REFERRAL/SECOND_OPINION), `status` (SENT/ACCEPTED/DECLINED/COMPLETED), `note` and the response. While the share is active, the receiving centre gets **read access to that one patient**, plus write access if it accepts a referral.
- **`MdtPost`** / **`MdtComment`**: a de-identified case summary (no PII fields at all), its author centre, linked documents that have teaching consent, comments, and a status of OPEN or RESOLVED.
- **`SupportRequest`**: `patientId`, `centerId`, `treatment`, `estimatedCostPkr`, `status` (SUBMITTED/APPROVED/FUNDED/CLOSED), `fundedAmount`, `sponsorName` and a public anonymised blurb (bilingual).
- **`AuditLog`** is reused as-is. Its `entity`/`action` are strings, so we only add new constants in `lib/registry/constants.ts`.

## Access control (`lib/registry/guards.ts`)
- Add `requireCenterMember(roles?, {write})`. It returns `{center, member}` and refuses access if the centre isn't APPROVED. When the membership is expired past grace, it refuses writes (read-only). Every centre query is scoped `where: {centerId: center.id}`, or goes through an active `CaseShare`.
- Role matrix:
  - **Reception:** patients' demographics, appointments and WhatsApp.
  - **Nurse:** the above, plus visits and uploads.
  - **Doctor:** everything clinical, including shares, NVAR, MDT and the support fund.
  - **Owner:** everything, plus staff, profile and payments.
- `requireApprovedClinician` stays unchanged for individual NVAR clinicians.
- Staff invite: create a Better Auth user with a random password and email a **password-reset link** as the invite, using Better Auth's built-in reset flow and `lib/registry/mailer.ts`.

## Pages & APIs
Follow the existing patterns: Zod `safeParse` → `NextResponse.json`, `verifyOrigin`, `handleApiError`, `rate-limit`, honeypot (copy `app/api/registry/enroll` and `clinicians/register`), RHF forms with the `fieldClass`/`FormField`/`WizardShell` components, and every string in `messages/{en,ur}.json` under a new `Centres` / `CentreDash` namespace.

**Public (`app/[locale]/…`)**
- `centres/apply`: a wizard covering centre details, head doctor and PMC number, licence, owner account, and optional payment proof (method + txn ID). It creates the user, a `Center` (APPLIED), a `CenterMember` OWNER and an optional `CenterPayment`.
- `find-a-specialist`: the directory now shows **approved DB centres** (with tier badge) merged with the static list. A small mapper turns a `Center` row into `CareCenter` and works out the map `pos` from lat/lng with the same projection `PakistanMap` uses.
- `centres/[slug]`: the public profile, with services, conditions, contact, badge, and a "Register as a patient here" button.
- `c/[slug]`: the **QR intake form**, a short bilingual patient form with consent. It creates a `RegistryPatient` (`source: SELF`, `centerId`) and returns the tracking code (`TrackingCodeCard`).
- `registry/status`: the existing lookup, extended to show the next appointment and centre name. It shows no clinical data.
- `centres/verify/[slug]`: the certificate check that the QR on the certificate points to.
- `support-fund`: anonymised APPROVED requests plus the existing `PaymentMethods` donation instructions.

**Centre dashboard (`app/[locale]/centre/…`)**, responsive and with its own `CentreNav` (copy `ClinicianNav`):
- **Overview:** today's appointments, new QR intakes, overdue follow-ups, incoming referrals and membership status.
- **Patients:**
  - Search by name/phone/CNIC through the blind index, or by MRN or tracking code.
  - New patient: reuse the steps of `ClinicianCaseWizard`.
  - **Patient detail timeline:** intake → visits → treatments → documents → appointments → shares, with buttons for *Add visit*, *Book follow-up*, *Upload*, *Share to NVAR*, *Refer/Share to centre*, *Post to MDT*, *Request support* and *Send on WhatsApp*.
- **Appointments:** day and week list views (no calendar library) with *Mark done/missed* and *WhatsApp reminder*.
- **Referrals:** inbox and outbox.
- **MDT board:** list, post and comment. It is visible to all approved centres and to PSOVA admins and experts.
- **Support requests.**
- **Staff:** invite, change role, deactivate (Owner only).
- **Profile & QR poster:** a printable page with the centre QR and bilingual "Scan to register" text.
- **Membership:** expiry, renewal (submit a txn ID) and payment history.
- **Reports:** counts by condition, treatment and outcome, plus a CSV export of the centre's own data, audit-logged.

**Admin (`app/[locale]/registry/admin/…`, extend `AdminNav`)**
- **Centres queue:** approve, reject, set tier, suspend or extend.
- **Payments to verify:** verifying a payment sets `membershipExpiresAt = max(now, current) + 1 year`.
- MDT moderation and the support fund workflow.
- **NVAR records:** now also include centre cases that are shared with NVAR, labelled with the source centre.

**APIs:** `app/api/centre/**` (dashboard), `app/api/centres/apply`, `app/api/centres/intake/[slug]`, `app/api/registry/admin/centres/**`, and `app/api/centre/documents/[id]` (an authenticated stream that decrypts the file on the fly).

**WhatsApp helper:** one function `waLink(phone, text)` that normalises the number to `92…`. Templates (tracking code, appointment reminder, missed visit) live in the messages JSON with placeholders. Each click is audit-logged as `WHATSAPP_OPENED`, with no PII in the log.

**Expiry handling:** no cron job is needed. Status is computed on read from `membershipExpiresAt`. Reminder emails go out the first time an owner or admin loads the dashboard inside the 30-day window, with a `lastReminderAt` flag on `Center`.

**Uploads (`lib/registry/storage.ts`)**
- Accept jpg, png, webp and pdf only, checked by magic bytes, up to 10 MB.
- The file is encrypted with AES-256-GCM using the existing `crypto.ts` key and written to `process.env.UPLOAD_DIR`. This **must be outside the deploy directory**, for example `~/psova-uploads`, or each deploy wipes it. `.env.example` and `docs/DEPLOY-HOSTINGER-MANUAL.md` (backups) get a note about it.
- There is a per-centre quota, 2 GB by default.
- **Tiers & certificate:** the admin sets the tier, and the criteria are shown on the public page. The certificate page is printable HTML with a QR code linking to `centres/verify/[slug]`. QR generation uses the `qrcode` npm package, which is added only if it isn't already a dependency.

**Mobile app (`apps/mobile`)**
- The snapshot includes approved DB centres, so the Directory shows them live with badges. `app/api/v1/content/snapshot` moves to a short `revalidate`.
- New native **"Check status"** screen, posting to the existing `/api/registry/status`.
- The More tab gets **Apply as a centre**, **Centre login / dashboard** and **Support fund**, which open the shared web pages.
- Set the manifest `scope` to `/` so those pages stay inside the installed app window.

## Phases (commit each as `centres(cN): …`; write this plan to `docs/centres/PLAN.md` at C1)
1. **C1 Foundation:** schema (Center, CenterMember, CenterPayment, new fields), guards, constants, `centres/apply`, admin queue with approve/reject/tier, and payment verification.
2. **C2 Directory:** DB centres in `find-a-specialist`, the centre profile page, the snapshot/mobile directory, badges, the certificate and verify page.
3. **C3 Dashboard shell:** centre nav, overview, staff invites and roles, profile, QR poster, membership renewal and expiry logic.
4. **C4 Patients:** QR intake `c/[slug]`, staff add-patient, patient list and search, the timeline page, and the WhatsApp helper.
5. **C5 Journey:** appointments, visits/encounters, treatments and outcomes, follow-up auto-booking, and the extended status lookup.
6. **C6 Uploads:** encrypted storage, the upload UI and the document viewer.
7. **C7 Sharing:** share to NVAR (with the NVAR query filter), referrals and second opinions between centres, and the MDT board.
8. **C8 Support fund + reports + mobile:** support requests, the public fund page, centre reports and CSV, and the mobile screens and links.

## Critical files
`prisma/schema.prisma`, `lib/registry/{guards,constants,schemas,patients,crypto,mailer}.ts`, new `lib/registry/{centers,storage,whatsapp}.ts`, `packages/content/src/centers.ts` (merge and mapper), `components/directory/DirectoryExplorer.tsx`, `app/api/v1/content/snapshot/route.ts`, `components/registry/*` (reuse `WizardShell`, `FormField`, `ConsentCheck`, `TrackingCodeCard`, `StatCard`, `Dialog`, `AdminNav`), new `components/centre/*`, `messages/{en,ur}.json`, `apps/mobile/src/screens.tsx`, `apps/mobile/public/manifest.webmanifest`, `.env.example`.

## Verification
- Run `npx tsc --noEmit` after each phase and `npx prisma migrate dev` locally.
- Run `npm run build` **once** at the end (the owner's rule). The owner tests runtime behaviour.
- Add an assert-based self-check script (`scripts/check-centre-isolation.ts`) that seeds two centres. It asserts:
  - Centre A cannot read B's patient.
  - A can read it only while a `CaseShare` is active.
  - Unshared centre cases are absent from NVAR queries and stats.
  - Expired-past-grace centres are blocked from writes and hidden from the directory.
- Manual smoke test by the owner:
  1. Apply → admin approve → verify payment.
  2. Centre appears on the map and in the app.
  3. Scan the QR → intake → it appears in the dashboard.
  4. Book an appointment → WhatsApp link opens.
  5. Add a visit and upload → share to NVAR and refer to a second centre.

## Risks to flag
- **Hostinger disk quota and backups:** the uploads folder must sit outside the deploy path and be backed up separately.
- **Placeholder accounts:** the payment account numbers are still placeholders and must be real before launch.
- **Unverified static list:** the static directory isn't confirmed with the institutions yet. Plan to replace it with DB centres as they join.
- **Legal:** sharing patient data between centres and to NVAR needs a consent wording that has been reviewed.

---

## Implementation status (C1 → C8 built, 2026-10)

All eight phases are implemented. Differences from the plan above, and what to know before go-live:

- **C4:** the `RegistryPatient` fields (`centerId`, `mrn`, `sharedWithNvar`, `consentCentre`) arrived with the patient work, together with the
  `NVAR_VISIBLE` rule (`lib/registry/visibility.ts`) that every NVAR-side query ANDs in.
- **C3:** renewal reminders repeat weekly while a membership is expiring or in grace (the plan said once).
- **C5:** appointment times are Pakistan time (UTC+5, no DST). Nurses record visits but not the plan or a treatment; reception sees no visits.
- **C6:** uploads are encrypted on disk under `UPLOAD_DIR` (outside the deploy folder, never `public/`); see `docs/DEPLOY-HOSTINGER-MANUAL.md`.
- **C7:** a **referral** gives the receiving centre its own *copy* of the record on accept (so every centre keeps scoping by `centerId`);
  a **second opinion** is de-identified and read-only. Neither moves visits, appointments or files.
- **C8:** support-fund donations are recorded **by hand** by a PSOVA admin (donors quote the request's `SF-…` code in the transfer reference);
  there is no gateway. Centre CSV export is owner-only, audited, and stays available after a membership lapses.
- **Not built:** the lab/pharma partner portal, patient accounts, a payment gateway, a WhatsApp API.

Before go-live: apply the migrations (`20261023…` to `20261028…`), set `UPLOAD_DIR`, replace the placeholder PSOVA payment accounts in
`packages/content/src/donation.ts`, have the consent wording reviewed (NVAR sharing, referrals, teaching use of files, support-fund publicity),
and run the isolation checks against a real database: centre A cannot read centre B's patients, unshared centre cases are absent from NVAR
admin lists/stats/exports, and a membership past its grace period is hidden and read-only.

