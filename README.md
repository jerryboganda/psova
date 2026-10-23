# PSOVA — Website, NVAR Registry, and Installable Mobile Web App

PSOVA is a bilingual English/Urdu platform for the Pakistan Society Of Vascular Anomaly. This repository contains the Next.js public website, the privacy-hardened National Vascular Anomaly Registry (NVAR), a mobile-first installable web app (PWA) served at `https://psova.org.pk/app/index.html`, shared validated content contracts, production APIs, and offline persistence.

The public/mobile information product does not diagnose a condition, interpret a photograph, replace a clinician, collect payments, or create a patient record. NVAR is a separate consented registry with its own security model. The optional local child-record concept remains disabled until PSOVA completes a separate clinical and privacy approval gate.

## Repository layout

| Path | Purpose |
|---|---|
| `app`, `components`, `i18n`, `messages` | Next.js website, NVAR routes, and versioned public/mobile APIs. |
| `prisma`, `lib/registry`, `docs/registry` | NVAR schema, field-level crypto, auth/operations, and deployment documentation. |
| `apps/mobile` | Vite/React mobile web app: manifest, service worker (offline), install prompt. |
| `packages/domain` | Versioned Zod contracts, local search, sync, and URL safety rules. |
| `packages/content` | Canonical bilingual conditions, directory, news, glossary, site, navigation, and donation data. |
| `tooling` | Content validation/export. |
| `.github/workflows` | Linux quality checks and the Hostinger production build. |
| `docs` | Architecture, operations, security, QA, registry, and deployment. |

## Local setup

Use Node.js 22 and the committed npm lockfile. Configure a MySQL/MariaDB database and the registry keys in `.env` when running NVAR. CPU-intensive clean builds run in GitHub Actions.

```bash
npm ci
npm run db:deploy       # when a configured registry database is available
npm run content:validate
npm run typecheck
npm run lint
npm run test
npm run test:mobile
npm run build
npm run mobile:build
```

```bash
npm run dev          # Website/NVAR at http://localhost:3000
npm run mobile:dev   # Mobile web app at http://localhost:1420
```

The mobile app includes a validated bundled snapshot, so its condition library, directory, glossary, and news open on first launch offline. Run `npm run content:build` after canonical content changes; CI rejects stale snapshots.

## NVAR registry

NVAR allows families and clinicians to enroll cases without patient accounts, issues a tracking code, supports PSOVA verification, and exposes a k-anonymized public statistics dashboard. Patient PII is AES-256-GCM encrypted at rest with separate HMAC blind indexes for lookup/deduplication, and decrypt-for-display actions are audit logged.

| Audience | Routes |
|---|---|
| Public | `/[locale]/registry`, `/registry/enroll`, `/registry/status`, `/registry/statistics` |
| Clinician | `/registry/login`, `/registry/clinician` |
| Admin | `/registry/admin` and its queue, record, clinician, audit, and export views |

NVAR adds Prisma/MySQL, Better Auth, Nodemailer, field-level crypto, and operational safeguards. Begin with `docs/registry/README.md`, then use `docs/registry/TASKS.md`, `docs/registry/SECURITY.md`, and `docs/registry/DEPLOYMENT-HOSTINGER.md`.

## Public/mobile backend configuration

Copy `.env.example` and provide real values through the deployment platform. Production contact delivery requires Resend plus durable Upstash-compatible storage. Push publication requires Firebase service-account credentials, durable encrypted token storage, and a protected publication secret. The contact API returns a retryable error when durable idempotency or provider acceptance is unavailable; it never claims delivery merely because validation passed.

## Mobile web app

There is no native Android/iOS app. Phones use the installable web app at `/app/index.html`: it has a web app manifest and
icons, a service worker that keeps it working offline, a first-run onboarding with the medical disclaimer, and an
"Install the PSOVA app" prompt (Android/desktop Chrome and Edge; iOS Safari shows "Share → Add to Home Screen" steps).
Preferences, favourites, the contact outbox, and the content snapshot live in the browser's `localStorage`. It ships with
every website deploy (see `docs/DEPLOY-HOSTINGER-MANUAL.md`).

## CI

| Workflow | Result |
|---|---|
| `quality.yml` | Prisma generation, content validation, lint, strict typecheck, tests/coverage, website/mobile builds, and production dependency audit. |
| `hostinger-build.yml` | Linux production build (website + mobile web app in `public/app/`) for upload to Hostinger. |

## Content and safety status

Directory records preserve verification status. Placeholder phones and unverified payment channels are removed from the mobile snapshot. Medical copy and Urdu require PSOVA clinician/native-language sign-off before public release. NVAR production additionally requires the registry security/deployment checklist and offline backup of both crypto keys.

## Documentation

Start with [Mobile Architecture](docs/ARCHITECTURE.md), [Mobile Operations](docs/OPERATIONS.md), [Known Limitations](docs/KNOWN_LIMITATIONS.md), [Test Report](docs/TEST_REPORT.md), [Journal Security Gate](docs/JOURNAL_SECURITY.md), and [NVAR Documentation](docs/registry/README.md).

Deploy the managed Node.js application to Hostinger using `docs/registry/DEPLOYMENT-HOSTINGER.md`; set `DOCKER_BUILD=1` only for the Docker/VPS standalone path.

General information only — not a substitute for professional medical advice.
