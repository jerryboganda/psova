# SECURITY — NVAR Encryption, Keys, RBAC, Audit & Threat Model

**This document is normative.** Any deviation requires owner approval.

---

## 1. Data classification

| Class | Fields | Storage |
|---|---|---|
| **PII (encrypted)** | fullName, guardianName, cnic, phone, altPhone, email, address, dob, clinical notes, pmcNumber | AES-256-GCM ciphertext, `TEXT` columns |
| **Blind index** | cnicHash, phoneHash, pmcHash | HMAC-SHA256 hex (keyed, irreversible without key) |
| **Categorical (plaintext)** | gender, province, district, birthYear/Month, isMinor, condition, ISSVA, severity, onset, treatments, status, consent flags | normal columns — required for statistics; k-anonymity protects outputs |
| **Operational** | tracking code, timestamps, audit rows | plaintext, non-identifying |

## 2. Encryption spec (`lib/registry/crypto.ts`)

### 2.1 Algorithm
- **AES-256-GCM** via Node `crypto.createCipheriv('aes-256-gcm', key, iv)`.
- 12-byte random IV per encryption (`crypto.randomBytes(12)`) — never reuse.
- 16-byte auth tag.
- Ciphertext string format: `v1.<iv b64>.<tag b64>.<ct b64>` (version-prefixed for future
  rotation/algorithm change).
- `decryptField` MUST verify the auth tag (GCM does) and throw a typed
  `RegistryCryptoError` on tamper/format errors — callers return 500 without detail.

### 2.2 Keys
| Env var | Purpose | Format |
|---|---|---|
| `REGISTRY_ENCRYPTION_KEY` | AES-256-GCM data key | base64 of 32 random bytes |
| `REGISTRY_INDEX_KEY` | HMAC-SHA256 blind-index key | base64 of 32 random bytes (MUST differ from data key) |
| `BETTER_AUTH_SECRET` | session/cookie signing | 32+ random chars |

Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

Rules:
- Keys live ONLY in env (hPanel → Environment variables in production; `.env` locally).
- Never committed, never logged, never sent to client. `NEXT_PUBLIC_` prefix forbidden.
- `crypto.ts` validates on first use: decodes base64, asserts 32 bytes, asserts keys differ;
  throws descriptive startup error if invalid/missing.
- **Loss of `REGISTRY_ENCRYPTION_KEY` = permanent loss of all PII.** Owner must store an
  offline copy (password manager + printed sealed copy). Documented in DEPLOYMENT runbook.
- Rotation (runbook, post-v1): add `v2` key env, script decrypt(v1)→encrypt(v2) row-by-row,
  flip default, retire v1. Format prefix makes this possible.

### 2.3 Blind indexes
`blindIndex(value, kind)` = `createHmac('sha256', INDEX_KEY).update(kind + ':' + normalize(value)).digest('hex')`.
- `kind` domain-separates (`cnic:`, `phone:`, `pmc:`).
- Normalizers per DATA-MODEL §4.
- Equality-only search **by design** — partial/LIKE search over PII is impossible; PRD
  documents this tradeoff.

## 3. RBAC matrix

| Capability | Public | Clinician (approved) | Admin |
|---|---|---|---|
| Enroll patient (self) | ✅ | ✅ | ✅ |
| Status lookup (code+phone) | ✅ | ✅ | ✅ |
| View public stats (k≥5) | ✅ | ✅ | ✅ |
| Register clinician account | ✅ (starts unapproved) | — | — |
| Submit clinical case | ❌ | ✅ | ✅ |
| View own submitted cases (decrypted) | ❌ | ✅ (own only) | ✅ |
| View any record decrypted | ❌ | ❌ | ✅ (audited) |
| Verify / reject / duplicate | ❌ | ❌ | ✅ (audited) |
| Approve clinicians | ❌ | ❌ | ✅ (audited) |
| CSV export (decrypted) | ❌ | ❌ | ✅ (audited) |
| View audit log | ❌ | ❌ | ✅ |
| Create admin | ❌ | ❌ | seed script only |

Enforcement points (defense in depth): protected layout (redirect) → API guard
(`requireRole`) → service functions assert caller role again for decrypt/export paths.

## 4. Audit policy

- Every action in DATA-MODEL §3 list writes an `AuditLog` row **in the same request**.
- PII decryption for display/export is NEVER silent: `RECORD_VIEW_PII` (per record) and
  `EXPORT_CSV` (with `meta: { rows, filters }`).
- Audit rows are append-only: no update/delete API exists; admin UI is read-only.
- `meta` must pass the "no-PII rule" (DATA-MODEL §3).
- Include `ip` (from `x-forwarded-for` first hop) and `actorRole` snapshot.

## 5. Application security requirements

1. **Validation:** every route Zod-validates body/query (`schemas.ts`); unknown keys stripped;
   payload size limit — reject bodies > 50 KB (enroll) with 413.
2. **Rate limits** (in-memory sliding window, per IP): enroll 5/h; status 10/h; login/register
   handled by Better Auth built-in rate limiting (enable) + our limiter 10/h on register;
   stats 60/h. 429 with `retry-after`.
3. **Anti-bot:** hidden honeypot field (`website`) on public forms → silently accept and drop
   (return fake success) when filled; audit `ENROLL_SUBMIT` with `meta.honeypot=true`.
4. **Enumeration resistance:** status lookup requires code **and** matching phone blind index;
   uniform "not found" response; uniform login errors (Better Auth default).
5. **Sessions:** httpOnly, `secure` in production, sameSite=lax cookies (Better Auth
   defaults); `BETTER_AUTH_URL` set to canonical https origin.
6. **Headers:** rely on same-origin App Router defaults; CSRF: Better Auth origin-checks
   auth routes; registry mutation routes verify `origin` header matches
   `NEXT_PUBLIC_SITE_URL` (helper in `guards.ts`) — return 403 on mismatch.
7. **Transport:** HTTPS only in production (Hostinger SSL); no PII in URLs ever (POST bodies
   only) — tracking code alone is not PII.
8. **Logging:** server logs may contain tracking codes and entity ids, never decrypted PII.
   No third-party telemetry on registry pages.
9. **Errors:** generic client messages; machine codes per API-SPEC; stack traces server-only.
10. **Dependencies:** no new deps beyond ARCHITECTURE §10 without justification.

## 6. Consent & lawful basis

- Consent screen (wizard step 4) records: `consentRegistry` (required), `consentContact`,
  `consentResearch`, `consentGuardian` (required if minor), `consentVersion`, `consentAt`.
- Consent text (bilingual) states: what is stored, encryption at rest, who can see it
  (PSOVA verification staff; treating clinician if clinician-submitted), purpose (national
  registry + anonymized statistics/research), retention (until removal requested), and the
  **right to removal/correction** via PSOVA contact (phone `+92 321 4261 950` / email).
- Context: aligned with Pakistan's draft Personal Data Protection Bill principles (purpose
  limitation, data minimization for outputs, security safeguards, consent). No formal DPA
  registration exists yet in PK; PSOVA medical board acts as data steward.
- Removal requests (v1 manual): admin locates record (blind-index search), deletes row
  (cascade) — audit `RECORD_UPDATE` with `meta.reason='erasure-request'`.

## 7. Statistics disclosure control

- Only `status = VERIFIED` records feed statistics.
- **k-anonymity: any aggregate cell with count < 5 is suppressed** (API returns `null`,
  UI shows "<5"). Totals are exact.
- No cross-filtering UI in v1 (pre-defined breakdowns only) — prevents differencing attacks.
- Minimum publication gate: dashboard shows "Data collection in progress" state until
  total VERIFIED ≥ 25 (constant `STATS_PUBLISH_THRESHOLD`).

## 8. Threat model (summary)

| Threat | Mitigation |
|---|---|
| DB dump stolen (shared-host compromise, backup leak) | PII unreadable: AES-256-GCM, keys not in DB; blind indexes non-reversible without index key |
| Env/keys leak via repo | `.gitignore` (.env), `.env.example` placeholders only, review before commit |
| Malicious insider (admin) | full audit trail of PII views/exports; owner reviews audit log |
| Rogue clinician account | approval gate before any submission; own-cases isolation; PMC number recorded |
| Scraping/enumeration of records | no public row endpoints; code+phone dual factor for status; rate limits; uniform errors |
| Spam/bot enrollments | honeypot, rate limit, admin verification step |
| XSS → session theft | React escaping, no `dangerouslySetInnerHTML` in registry, httpOnly cookies |
| CSRF | Better Auth origin checks + origin verification on mutations, sameSite cookies |
| SQLi | Prisma parameterized queries only; no raw SQL in registry module |
| Re-identification from stats | k≥5 suppression, coarse age bands, no cross-filters, publish threshold |
| Key loss | offline key backup procedure (owner), documented in deployment runbook |
| Mail interception | transactional mail contains tracking code only, never medical/PII details |

## 9. Backup & retention

- Enable Hostinger automatic MySQL backups (Business plan: weekly; document restore path).
- Ciphertext in backups is safe by design (keys separate).
- Audit logs retained indefinitely (small rows). Patient rows retained until erasure request.

## 10. Incident response (v1 lightweight)

Detect → freeze (rotate `BETTER_AUTH_SECRET`, revoke sessions) → assess scope via audit log →
if key compromise suspected: rotate encryption keys (runbook §2.2) → notify affected data
subjects via consented contact channel → post-mortem note in `docs/registry/`.
