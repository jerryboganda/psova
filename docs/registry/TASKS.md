# TASKS — NVAR Implementation Checklist (P1 → P8)

Execute phases **in order**. Within a phase, tasks are ordered. Tick boxes as you go.
**Verification policy: `npx tsc --noEmit` after each phase. NO full builds until P8.
Commit at the end of every phase: `registry(pN): <summary>`.**
Cross-reference: PRD (what), ARCHITECTURE (how), DATA-MODEL (schema), SECURITY (crypto/RBAC),
API-SPEC (endpoints), UI-SPEC (pages/keys), DEPLOYMENT-HOSTINGER (ship).

Local prerequisites: MySQL 8 / MariaDB running locally (or Hostinger Remote MySQL),
`.env` created from `.env.example` with generated keys.

---

## P1 — Foundation (DB · crypto · plumbing)

- [ ] 1.1 Install deps: `npm i @prisma/client better-auth nodemailer` and
      `npm i -D prisma tsx @types/nodemailer`
- [ ] 1.2 `package.json`: scripts per ARCHITECTURE §9 (`build` = `prisma generate && next build`,
      `postinstall`, `db:migrate`, `db:deploy`, `db:seed`, `prisma.seed` config)
- [ ] 1.3 `next.config.mjs`: conditional standalone (`DOCKER_BUILD`)
- [ ] 1.4 Create `.env.example` (all vars, placeholder values, comments — see DEPLOYMENT §3)
      and local `.env` (git-ignored; verify `git status` never shows it)
- [ ] 1.5 `prisma/schema.prisma` — full schema from DATA-MODEL §2; `npx prisma migrate dev
      --name init-registry`
- [ ] 1.6 `lib/registry/constants.ts` — provinces, body sites, onsets, ISSVA, severities,
      bases, treatment types/outcomes, age bands, `CONDITION_SLUGS` (import slugs from
      `data/conditions.ts`), `STATS_PUBLISH_THRESHOLD = 25`, `AuditAction` const object
- [ ] 1.7 `lib/registry/db.ts` — PrismaClient singleton (globalThis, dev HMR-safe)
- [ ] 1.8 `lib/registry/crypto.ts` — per SECURITY §2: `encryptField`, `decryptField`,
      `blindIndex(value, kind)`, `normalizeCnic`, `normalizePhone`, key validation,
      `RegistryCryptoError`
- [ ] 1.9 `lib/registry/codes.ts` — `generateTrackingCode()` `PSV-XXXX-XXXX`
      (Crockford alphabet `0-9 A-Z` minus `ILOU`), `normalizeTrackingCode(input)`,
      collision-retry helper (query unique)
- [ ] 1.10 `lib/registry/audit.ts` — `writeAudit()` (never throws; logs failure)
- [ ] 1.11 `lib/registry/rate-limit.ts` — sliding window in-memory `limit(bucket, ip, max, windowMs)`
- [ ] 1.12 `lib/registry/mailer.ts` — nodemailer transport, `sendEnrollmentConfirmation`,
      `sendClinicianApproval` (env-gated no-ops, bilingual plain text)
- [ ] 1.13 `lib/registry/schemas.ts` — ALL Zod schemas from API-SPEC (enroll, status,
      clinicianRegister, case, adminAction, list queries) + inferred types
- [ ] ✅ Gate: `npx tsc --noEmit` clean · migration applied · commit `registry(p1): foundation`

## P2 — Auth (Better Auth · guards · seed)

- [ ] 2.1 `lib/registry/auth.ts` — Better Auth instance: prisma adapter (`provider: 'mysql'`),
      `emailAndPassword.enabled`, `user.additionalFields.role` (default `clinician`,
      `input: false`), `rateLimit.enabled`, `trustedOrigins: [NEXT_PUBLIC_SITE_URL]`,
      `secret: BETTER_AUTH_SECRET`
- [ ] 2.2 `app/api/auth/[...all]/route.ts` — `toNextJsHandler`
- [ ] 2.3 `lib/registry/auth-client.ts` — `createAuthClient` (React)
- [ ] 2.4 `lib/registry/guards.ts` — `getSession(headers)`, `requireAdmin`,
      `requireApprovedClinician`, `verifyOrigin(req)`, `RegistryApiError` + `handleApiError`
      envelope helper
- [ ] 2.5 `POST /api/registry/clinicians/register` route per API-SPEC §1
- [ ] 2.6 `prisma/seed.ts` per DATA-MODEL §7; run `npx prisma db seed` locally and confirm
      admin login works via better-auth (manual: `npm run dev`, sign in)
- [ ] 2.7 `/[locale]/registry/login/page.tsx` + auth forms (UI-SPEC 3.5) + i18n keys
      (`RegistryAuth`) + role-based redirect
- [ ] 2.8 Protected layouts: `admin/layout.tsx` (requireAdmin), `clinician/layout.tsx`
      (session + clinician; render pending screen when `!approved`)
- [ ] ✅ Gate: tsc clean · manual login round-trip works · commit `registry(p2): auth`

## P3 — Public: landing · enrollment wizard · status lookup

- [ ] 3.1 Shared components: `WizardShell`, `FormField`, `ConsentCheck`, `TrackingCodeCard`,
      `RegistryBadge` (UI-SPEC §2)
- [ ] 3.2 `lib/registry/patients.ts` — `createEnrollment()` (ARCHITECTURE §3.1: normalize →
      hash → encrypt → code → transaction → duplicate flag → audit → mail)
- [ ] 3.3 `POST /api/registry/enroll` route (rate limit, honeypot, origin check)
- [ ] 3.4 `/[locale]/registry/enroll/page.tsx` — 5-step wizard (UI-SPEC 3.2); full
      `RegistryEnroll` keys EN+UR
- [ ] 3.5 `statusLookup()` service + `POST /api/registry/status` + `/registry/status` page
      (UI-SPEC 3.3, `RegistryStatus` keys)
- [ ] 3.6 `/[locale]/registry/page.tsx` landing (UI-SPEC 3.1, `Registry` keys incl. full
      bilingual consent/privacy copy per SECURITY §6)
- [ ] 3.7 Manual smoke (dev): enroll → code shown → status lookup finds it → row visible in
      `npx prisma studio` with ciphertext (spot-check: PII columns start `v1.`)
- [ ] ✅ Gate: tsc clean · commit `registry(p3): public enrollment`

## P4 — Clinician portal

- [ ] 4.1 `createClinicianCase()` in `patients.ts` + `POST/GET /api/registry/cases`
      (+ `[id]` own-detail) per API-SPEC §3
- [ ] 4.2 `DataTable` component
- [ ] 4.3 `/registry/clinician` my-cases page + pending-approval state (UI-SPEC 3.6)
- [ ] 4.4 `/registry/clinician/new-case` — clinical wizard (treatments repeater, ISSVA,
      attestation) + `RegistryClinician` keys
- [ ] ✅ Gate: tsc clean · commit `registry(p4): clinician portal`

## P5 — Admin dashboard

- [ ] 5.1 Services: `listRecords`, `decryptPatient`, `applyAdminAction` (transitions
      DATA-MODEL §6), `listClinicians`, `setClinicianApproval`, `exportCsv` (streaming),
      `listAudit`
- [ ] 5.2 API routes: admin records (list, [id] GET/PATCH), clinicians (list/[id] PATCH),
      export, audit — all guarded + audited per API-SPEC §4
- [ ] 5.3 `AdminNav`, `StatCard`, `Dialog` components
- [ ] 5.4 Pages: overview · queue · records (+filters/search) · record detail (decrypted
      panel, duplicate banner, action dialogs) · clinicians · audit (UI-SPEC 3.7,
      `RegistryAdmin` keys)
- [ ] 5.5 Manual smoke: verify a record → status lookup shows VERIFIED; export CSV opens;
      audit rows appear for view/verify/export
- [ ] ✅ Gate: tsc clean · commit `registry(p5): admin dashboard`

## P6 — Public statistics

- [ ] 6.1 `lib/registry/stats.ts` — `getPublicStats()` with k-anonymity nulling (<5) +
      publish threshold; age bands from `birthYear`
- [ ] 6.2 `GET /api/registry/stats` (revalidate 3600)
- [ ] 6.3 `BarList`, `TrendLine` components (+ sr-only tables)
- [ ] 6.4 `/registry/statistics` page (UI-SPEC 3.4, `RegistryStats` keys)
- [ ] ✅ Gate: tsc clean · commit `registry(p6): statistics`

## P7 — Integration · i18n completeness · polish

- [ ] 7.1 `data/navigation.ts`: add registry top-level + footer link; `Nav.registry` EN+UR
- [ ] 7.2 Home page: small registry CTA section (reuse existing section pattern)
- [ ] 7.3 `app/sitemap.ts` add public registry routes; `app/robots.ts` disallow
      `/registry/admin`, `/registry/clinician`, `/api/`
- [ ] 7.4 i18n audit: every `Registry*` key exists in BOTH en.json and ur.json (script-check:
      quick node script comparing key sets — run once, don't add to CI)
- [ ] 7.5 RTL pass in dev (`/ur/registry/...`): wizard, tables, badges, charts (UI-SPEC §5)
- [ ] 7.6 A11y pass: labels, focus management, dialog traps, chart tables
- [ ] 7.7 README.md: add short NVAR section + link to docs/registry/
- [ ] ✅ Gate: tsc clean · commit `registry(p7): integration & i18n`

## P8 — Ship

- [ ] 8.1 `npx tsc --noEmit` final
- [ ] 8.2 **Single** `npm run build` sanity check (the only full build — fix what it flags)
- [ ] 8.3 Confirm `.env` not staged; `.env.example` complete
- [ ] 8.4 `git init` (if needed) → commit → `git remote add origin
      https://github.com/jerryboganda/psova.git` → push `main`
- [ ] 8.5 Owner follows DEPLOYMENT-HOSTINGER.md; report launch checklist status
- [ ] ✅ Done — hand over with summary of routes, env vars, seed instructions

## Standing rules (all phases)

1. Never render/log decrypted PII outside specified admin/clinician/status paths.
2. Every user-facing string via next-intl — both locales in the same task.
3. Reuse `components/ui/*`; no new dependencies beyond ARCHITECTURE §10.
4. `Link`/`redirect` from `@/i18n/navigation` for locale routes.
5. Quick checks only (`tsc --noEmit`); no test scaffolding, no CI files, single final build.
6. If an external API surface differs from spec (e.g., better-auth minor API change), adapt
   implementation, keep spec intent, note deviation in commit message.
