# PSOVA Mobile Architecture

## System summary

PSOVA uses one repository and one canonical content source for two clients. The Next.js 16 website/API remains at the repository root. `apps/mobile` is a separate Vite/React shell packaged by Tauri 2. Platform-neutral schemas and content live in `packages/domain` and `packages/content`; compatibility exports preserve existing website imports.

| Layer | Responsibility | Trust boundary |
|---|---|---|
| Mobile React bundle | Navigation, bilingual UI, offline search, contact outbox, and user-visible state. | Untrusted input; no provider secrets. |
| Tauri Rust core | Plugin initialization, SQLite migrations, external-URL defense, and narrow app metadata commands. | Privileged local process with least-privilege capabilities. |
| Native push plugin | FCM token on Android and FCM/APNs token on iOS after consent. | One focused command; no message content or service-account secret. |
| Next.js API | Content snapshots, contact acceptance, token registration, protected push publication, and provider webhook verification. | Server-only credentials and durable idempotency records. |
| External providers | Resend email acceptance, Upstash-compatible durable KV, Firebase Cloud Messaging, APNs through FCM. | Owner-controlled accounts and retention terms. |

## Content and offline lifecycle

`tooling/build-content-snapshot.ts` validates IDs, slugs, bilingual fields, review metadata, and publication safety before writing the same versioned JSON snapshot to the website and mobile public directories. A SHA-256 checksum covers the review state and all content collections.

On first launch, the mobile client verifies and installs the bundled snapshot. Refresh requests use an ETag and a ten-second timeout. A candidate snapshot is parsed with the shared schema and independently hashed before a transaction marks it current. Any parsing, schema-version, network, or checksum failure leaves the last known-good content in place.

SQLite migrations create content snapshots, favorites, news state, contact outbox, disabled journal metadata, and reminders. Tauri Store holds locale, theme, and notification preferences. Browser local storage is only a development/test fallback and is not the native production store.

## Contact delivery

The app validates a submission, assigns a UUID idempotency key, and saves a pending outbox record before network work. The API validates content type and size, rate-limits a privacy-preserving HMAC fingerprint, checks the durable idempotency ledger, and sends through Resend. Only provider acceptance changes the record to `sent`. Duplicate client retries return `duplicate`; provider/network failures return retryable status and remain queued with bounded exponential backoff.

The production API refuses delivery when durable KV is absent. Free-text contact content is never placed in rate-limit keys, idempotency logs, push payloads, or error telemetry.

## Push lifecycle

The user encounters notification consent inside News, never on first launch. The official local-notification plugin requests OS permission. The focused `psova-push` plugin then requests a native FCM registration token. The backend encrypts the token using AES-256-GCM, stores only an HMAC fingerprint in its installation index, and records platform, locale, app version, consent time, and last-seen time.

A protected publication endpoint accepts only approved news records for non-dry-run delivery. The server obtains a short-lived Google OAuth token using its service account, sends FCM HTTP v1 messages, collapses duplicates by event ID, and removes registrations that FCM reports as invalid. Publication is idempotent by event ID.

## Navigation and native actions

Hash routing avoids dependence on a remote navigation server. `psova://condition/<slug>`, `psova://news/<id>`, and `psova://directory` are parsed by shared allowlisted logic. Custom-scheme links work without domain verification. Universal/app links are intentionally deferred until PSOVA controls the final production domain and can host Apple/Android association files.

Telephone, WhatsApp, maps, and website actions pass through TypeScript validation and an independent Rust host allowlist before Tauri Opener receives them. Arbitrary schemes, JavaScript URLs, shell commands, and unrestricted browser destinations are not exposed.

## Privacy boundary

Core browsing needs no account and uploads no medical browsing history. Favorites and preferences remain local. Contact data leaves the device only after explicit submission. The child record remains disabled; its proposed local encryption and biometric controls are documented in `JOURNAL_SECURITY.md` and cannot be enabled by UI state alone.
