# PSOVA Operations Runbook

## Environment ownership

Server secrets belong in the deployment platform and GitHub environment secrets, never in the repository or mobile bundle. The canonical names are in `.env.example`.

| Capability | Required configuration | Failure behavior |
|---|---|---|
| Contact delivery | Resend API key, verified sender, destination address, webhook secret | API returns retryable 503; outbox remains queued. |
| Durable idempotency/rate limits | Upstash-compatible REST URL/token and HMAC key | Production contact/push registration refuses unsafe fallback. |
| Push fan-out | Firebase project, service-account email/private key, publication secret, token encryption key | Token publication/register routes return safe errors; no audience send. |
| Native Android push | Base64 `google-services.json` in GitHub secret | Android app builds, but token acquisition clearly fails until configured. |
| Native iOS push | Base64 `GoogleService-Info.plist`, APNs entitlement/profile | iOS app builds only when Firebase/Apple configuration is valid. |

## Content publication

Edit canonical files in `packages/content/src`. Preserve the explicit verification/publication flags; do not change a directory record to verified or a news record to published without the responsible PSOVA approval.

```bash
npm run content:build
npm run content:validate
npm run test
npm run build
npm run mobile:build
```

Commit the canonical data and both generated snapshots together. Deployment exposes `/api/v1/content/manifest` for inexpensive checks and `/api/v1/content/snapshot` for ETag-backed downloads. If clients reject a snapshot, revert the content commit, rebuild, and deploy a new revision; clients retain their previous known-good revision during the incident.

## Contact operations

A successful API response means Resend accepted the message. It does not mean a human has responded. Use the Resend dashboard and verified webhook records to investigate delivery events. Never paste a user's form body into issue trackers or chat. Troubleshooting logs should use only submission ID, provider ID, status, timestamp, and redacted error category.

For a provider outage, leave clients queued, restore the provider/configuration, and allow normal foreground/network restoration to retry. Do not manually resubmit messages unless the idempotency ledger shows no acceptance and the user has authorized recovery.

## Push publication

Prepare a news record with complete English/Urdu content and keep `publicationStatus: draft` during review. Use the protected `/api/v1/push/publish` endpoint with `dryRun: true` and a unique event ID. A live send requires both a `published` record and `dryRun: false`.

```json
{
  "eventId": "news-2026-08-example-v1",
  "newsId": "approved-news-id",
  "dryRun": true
}
```

Production audience sends are representational external actions. Require PSOVA owner approval immediately before changing `dryRun` to false. Never include health details, names, phone numbers, or contact-form content in a notification.

## Key rotation and revocation

Rotate Resend, Upstash, Firebase, signing, and publication credentials using the provider dashboards and protected CI environments. Rotating `PUSH_TOKEN_ENCRYPTION_KEY` makes previously encrypted tokens unreadable; plan this as a forced re-registration release, not an ordinary secret replacement. Rotate `RATE_LIMIT_HMAC_KEY` without user-visible impact, accepting that active rate-limit windows reset.

## Rollback and incidents

| Incident | First response | Recovery |
|---|---|---|
| Invalid content deployed | Stop further publication and revert canonical content. | Rebuild/deploy a new valid snapshot; clients retain last known-good data. |
| Contact provider outage | Confirm retryable responses; do not claim delivery. | Restore provider/KV and allow idempotent retries. |
| Push sent in error | Revoke publication credential and stop further sends. | Publish a correction only with owner approval; document event IDs and scope. |
| Token/storage exposure | Revoke affected credentials and disable registration/publication routes. | Rotate keys, purge registrations, require clients to re-consent/register. |
| App regression | Pause rollout in Play/TestFlight. | Promote the last approved build or ship a corrected incremented build. |

Medical or privacy incidents must be escalated to the designated PSOVA owner. Preserve provider IDs and timestamps, but minimize copied personal data.
