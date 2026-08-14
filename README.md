# PSOVA — Website, NVAR Registry, and Tauri 2 Mobile App

PSOVA is a bilingual English/Urdu platform for the Pakistan Society Of Vascular Anomaly. This repository contains the Next.js public website, the privacy-hardened National Vascular Anomaly Registry (NVAR), a mobile-first Tauri 2 application for Android and iOS, shared validated content contracts, production APIs, offline persistence, and protected GitHub Actions release pipelines.

The public/mobile information product does not diagnose a condition, interpret a photograph, replace a clinician, collect payments, or create a patient record. NVAR is a separate consented registry with its own security model. The optional local child-record concept remains disabled until PSOVA completes a separate clinical and privacy approval gate.

## Repository layout

| Path | Purpose |
|---|---|
| `app`, `components`, `i18n`, `messages` | Next.js website, NVAR routes, and versioned public/mobile APIs. |
| `prisma`, `lib/registry`, `docs/registry` | NVAR schema, field-level crypto, auth/operations, and deployment documentation. |
| `apps/mobile` | Vite/React mobile shell and Tauri 2 native configuration. |
| `apps/mobile/plugins/tauri-plugin-psova-push` | Focused Kotlin/Swift FCM/APNs registration bridge. |
| `packages/domain` | Versioned Zod contracts, local search, sync, and URL safety rules. |
| `packages/content` | Canonical bilingual conditions, directory, news, glossary, site, navigation, and donation data. |
| `tooling` | Content validation/export and validated store screenshot capture. |
| `.github/workflows` | Linux quality, Android, iOS simulator, and protected signed-release jobs. |
| `docs` | Architecture, operations, security, QA, release, registry, and store handover. |

## Local setup

Use Node.js 22 and the committed npm lockfile. Configure a MySQL/MariaDB database and the registry keys in `.env` when running NVAR. Rust 1.77.2 or newer is required for Tauri; Android compilation uses Java 17, API 36, and NDK 28.2; iOS compilation requires macOS/Xcode and CocoaPods. CPU-intensive clean/native builds run in GitHub Actions.

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
npm run mobile:dev   # Mobile Tauri/Vite development shell
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

## Mobile native configuration

The bundle identifier is `pk.org.psova.mobile`. Android FCM builds require `google-services.json`; iOS FCM/APNs builds require `GoogleService-Info.plist` and Apple push entitlements. These files are ignored by Git and can be supplied to CI with `GOOGLE_SERVICES_JSON_BASE64` and `GOOGLE_SERVICE_INFO_PLIST_BASE64`.

Tauri capabilities are deny-by-default. SQLite holds content snapshots, favorites, news state, contact outbox records, disabled journal blobs, and reminders. Tauri Store holds lightweight preferences. The custom native push bridge exposes only consented platform-token acquisition.

## CI and release

| Workflow | Result |
|---|---|
| `quality.yml` | Prisma generation, content validation, lint, strict typecheck, tests/coverage, website/mobile builds, and production dependency audit. |
| `mobile-android.yml` | Clean Android SDK/NDK provisioning, Tauri initialization, debug APK build, retained artifact. |
| `mobile-ios.yml` | macOS/Xcode Tauri initialization, simulator build, retained artifact. |
| `mobile-release.yml` | Protected signed Android AAB and iOS IPA preparation; never store publication. |

Store submission, staged rollout, production push sends, credential/account changes, and public publication remain explicit owner-confirmed actions.

## Content and safety status

Directory records preserve verification status. Placeholder phones and unverified payment channels are removed from the mobile snapshot. Medical copy and Urdu require PSOVA clinician/native-language sign-off before public release. Draft news cannot be used for a live push. NVAR production additionally requires the registry security/deployment checklist and offline backup of both crypto keys.

## Documentation

Start with [Mobile Architecture](docs/ARCHITECTURE.md), [Mobile Operations](docs/OPERATIONS.md), [Mobile Release](docs/RELEASE.md), [Store Package](docs/STORE_PACKAGE.md), [Known Limitations](docs/KNOWN_LIMITATIONS.md), [Test Report](docs/TEST_REPORT.md), [Journal Security Gate](docs/JOURNAL_SECURITY.md), and [NVAR Documentation](docs/registry/README.md).

Deploy the managed Node.js application to Hostinger using `docs/registry/DEPLOYMENT-HOSTINGER.md`; set `DOCKER_BUILD=1` only for the Docker/VPS standalone path.

General information only — not a substitute for professional medical advice.
