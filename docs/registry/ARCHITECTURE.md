# ARCHITECTURE — NVAR (National Vascular Anomaly Registry)

How the registry is built into the existing PSOVA Next.js app. Read `PRD.md` first.

---

## 1. Constraints that shaped this design

| Constraint | Consequence |
|---|---|
| Hostinger **Business shared hosting** (hPanel managed Node.js, verified Dec-2025 feature) | Single Node process; no Docker/Redis/PM2; `next start` on injected `PORT`; builds run on Hostinger from GitHub |
| DB = Hostinger **MariaDB** (MySQL-compatible), unpublished `max_user_connections` (~25) | Prisma `mysql` provider; `connection_limit=5` in `DATABASE_URL`; singleton PrismaClient |
| Full PII incl. CNIC stored, **AES-256-GCM at rest** (owner mandate) | App-layer field encryption + HMAC blind indexes; DB never sees plaintext PII |
| Existing site is static-first, bilingual, design-system driven | Registry pages are dynamic (`force-dynamic` where needed) but reuse all UI primitives & i18n |
| Owner: no long CI; quick checks only | `tsc --noEmit` during dev; one final build |

## 2. Module map (new code)

```
prisma/
  schema.prisma            all models (registry + Better Auth)
  seed.ts                  admin user seeding (env-driven)
lib/registry/
  db.ts                    PrismaClient singleton (globalThis cache, dev HMR-safe)
  crypto.ts                encryptField / decryptField (AES-256-GCM), blindIndex (HMAC-SHA256),
                           normalizers (cnic, phone), key loading + validation
  codes.ts                 tracking code generator PSV-XXXX-XXXX (Crockford base32, retry on collision)
  audit.ts                 writeAudit({actor, action, entity, entityId, meta, ip})
  mailer.ts                nodemailer transport (env-gated; no-op logs when unconfigured)
  rate-limit.ts            in-memory sliding-window limiter keyed ip+bucket (single process OK)
  patients.ts              domain service: createEnrollment, createClinicianCase, decryptPatient,
                           verify/reject/markDuplicate, listRecords, exportCsv, statusLookup
  stats.ts                 aggregate queries + k-anonymity suppression (<5 → null)
  auth.ts                  Better Auth server instance (prisma adapter, roles)
  auth-client.ts           Better Auth React client
  guards.ts                requireSession/requireRole helpers for layouts & API routes
  schemas.ts               ALL registry Zod schemas (shared client+server)
  constants.ts             provinces, age bands, ISSVA categories, condition slug list (+other)
components/registry/
  (see UI-SPEC.md — wizard, fields, admin tables, stat charts, status badge, etc.)
app/[locale]/registry/
  page.tsx                 landing (public)
  enroll/page.tsx          wizard (public)
  status/page.tsx          tracking lookup (public)
  statistics/page.tsx      public dashboard
  login/page.tsx           auth (login + clinician registration tabs)
  clinician/layout.tsx     guard: session + role clinician + approved
  clinician/page.tsx       my cases
  clinician/new-case/page.tsx
  admin/layout.tsx         guard: session + role admin (+ admin nav sidebar)
  admin/page.tsx           overview
  admin/queue/page.tsx
  admin/records/page.tsx
  admin/records/[id]/page.tsx
  admin/clinicians/page.tsx
  admin/audit/page.tsx
app/api/auth/[...all]/route.ts      Better Auth handler (GET, POST)
app/api/registry/
  enroll/route.ts          POST public
  status/route.ts          POST public
  stats/route.ts           GET public (revalidate 3600)
  cases/route.ts           POST + GET (clinician)
  admin/records/route.ts   GET list/search
  admin/records/[id]/route.ts  GET decrypted / PATCH actions
  admin/clinicians/route.ts    GET / PATCH approve-reject
  admin/export/route.ts    GET CSV stream
  admin/audit/route.ts     GET
```

## 3. Request flows

### 3.1 Enrollment (public)
1. Client wizard (RHF+Zod per step) → single `POST /api/registry/enroll` with full payload
   + honeypot field.
2. Route: rate-limit (5/h/IP) → `schemas.enrollSchema.safeParse` → honeypot check.
3. `patients.createEnrollment`: normalize CNIC/phone → compute `cnicHash`,`phoneHash` →
   encrypt PII fields → generate tracking code → `prisma.$transaction` insert Patient +
   Diagnosis(+Treatments) → check blind-index collisions → set `possibleDuplicate` flag.
4. Audit `ENROLL_SUBMIT` (no PII in meta). Fire-and-forget confirmation email.
5. Response: `{ ok, trackingCode }`. Client shows success screen.

### 3.2 Admin verify
1. Admin opens record → server component calls `guards.requireRole('admin')` →
   `patients.decryptPatient(id)` → audit `RECORD_VIEW_PII`.
2. Action buttons → `PATCH /api/registry/admin/records/[id]` `{ action: 'VERIFY'|'REJECT'|
   'DUPLICATE', publicReason?, internalNote?, canonicalId? }` → status transition guard
   (PENDING→VERIFIED/REJECTED/DUPLICATE; VERIFIED→REJECTED allowed with audit) → audit.

### 3.3 Public stats
`GET /api/registry/stats` → `stats.getPublicStats()`; `groupBy` on VERIFIED only; every
bucket `< 5` replaced by `null` (UI renders "<5"); response cached
(`export const revalidate = 3600` on the route + `unstable_cache` optional). Statistics page
is a server component consuming the same service directly (no self-fetch).

## 4. AuthN/AuthZ

- **Better Auth** server instance in `lib/registry/auth.ts`: prisma adapter (mysql),
  `emailAndPassword: { enabled: true }`, `user.additionalFields.role`
  (string, default `'clinician'`, input disabled — role never client-settable),
  `trustedOrigins` from `NEXT_PUBLIC_SITE_URL`.
- Handler at `app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)`.
- Clinician signup: Better Auth `signUpEmail` + server hook (`databaseHooks.user.create.after`
  or explicit API wrapper `POST /api/auth/...` then profile creation inside the same request
  via `schemas.clinicianRegisterSchema`) creating `ClinicianProfile(approved:false)`.
  Implementation choice: custom route `POST /api/registry/clinicians/register` wrapping
  `auth.api.signUpEmail` + profile create in a transaction — keeps one round trip.
- **Admin creation only via seed** (`prisma/seed.ts` reads `ADMIN_EMAIL/ADMIN_PASSWORD/
  ADMIN_NAME`, creates user via `auth.api.signUpEmail`, then sets `role='admin'`).
- **Guards:** protected *layouts* call `auth.api.getSession({ headers: await headers() })`
  and check role (+ `approved` for clinicians) — redirect to `/registry/login`. API routes
  call the same guard helper and return 401/403 JSON. `middleware.ts` stays next-intl-only
  (its matcher already excludes `/api`; page-level guards are authoritative — no security
  reliance on middleware).
- Sessions: Better Auth cookie sessions (httpOnly, secure in prod, sameSite lax).

## 5. Encryption boundary (summary — full spec in SECURITY.md)

- `crypto.ts` is the ONLY module allowed to touch keys. Keys: `REGISTRY_ENCRYPTION_KEY`,
  `REGISTRY_INDEX_KEY` (32-byte base64 each; startup validation with clear error).
- Ciphertext string format: `v1.<iv b64>.<tag b64>.<ct b64>` stored in `TEXT` columns.
- Blind indexes: `hmacSHA256(indexKey, normalized_value)` hex — equality search only.
- Decryption happens only in: admin record detail, admin CSV export, clinician own-case
  detail, status lookup (first-name only). Each decrypting call site audits.

## 6. Data & caching

- Registry pages that read session/DB: `export const dynamic = 'force-dynamic'` (admin,
  clinician, status). Landing + enroll wizard render static shells (forms client-side).
- Statistics: ISR — `revalidate = 3600`.
- `generateStaticParams` locales still apply; registry pages under `[locale]` keep
  `setRequestLocale`.
- No Redis: rate limiter is in-memory (documented limitation: resets on restart, fine for v1
  on single Hostinger process).

## 7. Email

`mailer.ts`: nodemailer `createTransport({ host: SMTP_HOST, port: 465, secure: true,
auth: { user, pass } })`. Templates (plain, bilingual text): enrollment confirmation
(tracking code), clinician approval. If SMTP env missing → log `[registry mail skipped]`
and continue (never fail the request on mail errors).

## 8. Error handling & responses

API envelope: success `{ ok: true, ...data }`, failure `{ ok: false, error: <machine-code>,
message?: <safe english> }` with proper status (400 validation, 401, 403, 404, 409 state
conflict, 429 rate limit, 500 generic). Never leak stack traces, Prisma errors, or PII in
errors. Client maps machine-codes to localized messages.

## 9. Config changes to existing files

| File | Change |
|---|---|
| `next.config.mjs` | `output: process.env.DOCKER_BUILD ? 'standalone' : undefined`; add `serverExternalPackages: ['@prisma/client', 'prisma']` if build complains |
| `package.json` | deps: `@prisma/client`, `better-auth`, `nodemailer`; dev: `prisma`, `tsx`, `@types/nodemailer`; scripts: `"build": "prisma generate && next build"`, `"postinstall": "prisma generate"`, `"db:migrate": "prisma migrate dev"`, `"db:deploy": "prisma migrate deploy"`, `"db:seed": "prisma db seed"`; `"prisma": { "seed": "tsx prisma/seed.ts" }` |
| `data/navigation.ts` | add `{ key: 'registry', href: '/registry' }` top-level after `findCare`; footer society column |
| `messages/en.json` / `ur.json` | new namespaces per UI-SPEC.md |
| `app/sitemap.ts` | add public registry routes |
| `app/robots.ts` | disallow `/registry/admin`, `/registry/clinician`, `/api/` |
| `.env.example` (new) | all vars per DEPLOYMENT-HOSTINGER.md §Env |
| `.gitignore` | already ignores `.env` ✅ |

## 10. Dependency versions (pin majors, use latest minors at install time)

- `prisma` / `@prisma/client` **^6** (works with Node 18+/22; add
  `binaryTargets = ["native", "debian-openssl-3.0.x"]` for Hostinger Linux build image)
- `better-auth` **^1** (Next 15/16 App Router compatible, prisma adapter, zod-free API)
- `nodemailer` **^7** + `@types/nodemailer`
- `tsx` (dev) for seed script
- **Do not add**: chart libs, UI kits, Redis clients, tRPC. Keep footprint small.

## 11. Decisions log (ADR-lite)

1. **App-layer AES-256-GCM over MySQL TDE** — shared hosting offers no TDE; app-layer gives
   provable per-field control + auditability.
2. **Blind indexes over LIKE search** — encrypted columns can't be partially searched;
   exact-match HMAC covers dedup + admin lookup; accepted tradeoff documented in PRD.
3. **Better Auth over NextAuth** — first-class email/password + prisma + roles with minimal
   ceremony on Next 16 / React 19.
4. **No patient accounts** — tracking code + phone match; drastically lowers PII surface and
   friction (owner decision Q1/Q3).
5. **In-memory rate limiter** — single-process host; Redis unavailable; acceptable v1.
6. **SVG/CSS charts** — avoid heavy chart deps; design-system gradients; a11y via tables
   (visually-hidden data table alternative for each chart).
7. **Conditional `standalone` output** — Hostinger managed pipeline expects `next start`;
   Docker path kept for polytronx VPS fallback via `DOCKER_BUILD=1`.
