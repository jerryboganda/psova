# DEPLOYMENT — Hostinger Business (hPanel) Runbook

> **Production note (2026-10-22):** the live psova.org.pk app is NOT linked to Git, so pushes to `main` do not
> auto-deploy. See [../DEPLOY-HOSTINGER-MANUAL.md](../DEPLOY-HOSTINGER-MANUAL.md) for the real procedure.

Deploying PSOVA + NVAR to **Hostinger Business Web Hosting** (shared, hPanel).
Verified capabilities (Dec 2025 rollout): managed Node.js apps on Business plan (up to 5),
Node 18/20/22/24, GitHub auto-deploy, env vars UI, SSH, cron, MariaDB (MySQL-compatible),
SMTP `smtp.hostinger.com:465`. Next.js is officially supported for SSR.
Refs: hostinger.com/support → "How to deploy a Node.js website", "Environment variables
after deployment", "Remote MySQL", "Hosting plan limits".

---

## 0. Architecture on Hostinger

```
GitHub (jerryboganda/psova, main)
   │ push → auto build & deploy (Hostinger pipeline)
   ▼
hPanel "Web App" (Node.js) — next start on injected PORT   ←→  MariaDB (same plan)
   │                                                        ▲
   └── smtp.hostinger.com:465 (transactional mail)          └── Remote MySQL (your PC, for
                                                                 prisma migrate deploy)
```

Key facts: single Node process (in-memory rate limiter OK) · ~3 GB RAM / 2 cores shared
across the plan · **no Stop button** (remove website to take app down; Restart available) ·
Node app must be created as a **new website** in hPanel · builds run on Hostinger's servers.

## 1. Create the database (hPanel → Databases → MySQL)

1. Create database `uXXXXXXX_psova`, user `uXXXXXXX_psova`, strong password.
2. Note the DB host shown (usually `localhost` for the app; a remote hostname like
   `srvNNNN.hstgr.io` for Remote MySQL).
3. `DATABASE_URL` (app, in hPanel env):
   `mysql://uXXXXXXX_psova:PASS@localhost:3306/uXXXXXXX_psova?connection_limit=5&pool_timeout=20`
4. Hostinger enforces an unpublished `max_user_connections` (~25) — keep `connection_limit=5`.

## 2. Run migrations from your PC (Remote MySQL)

1. hPanel → Databases → Remote MySQL → add your public IP (or "Any Host" temporarily —
   remove afterwards).
2. Locally: `DATABASE_URL="mysql://uXXXXXXX_psova:PASS@srvNNNN.hstgr.io:3306/uXXXXXXX_psova" npx prisma migrate deploy`
   (PowerShell: set `$env:DATABASE_URL=...` first).
3. Seed admin the same way: set `ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME` + remote
   `DATABASE_URL` (+ `BETTER_AUTH_SECRET`, both registry keys — seed uses auth) →
   `npx prisma db seed`.
4. Remove the Remote MySQL IP grant when done.
   *(Alternative: run migrate via hPanel SSH from the deployed app directory.)*

## 3. Environment variables (hPanel → website → Settings & Redeploy → Environment variables)

You can import a `.env` file. **Changes require Redeploy to take effect.**

```env
# --- Database ---
DATABASE_URL="mysql://user:pass@localhost:3306/db?connection_limit=5&pool_timeout=20"
# --- Site ---
NEXT_PUBLIC_SITE_URL="https://psova.org.pk"     # canonical https origin (or current domain)
# --- Auth ---
BETTER_AUTH_SECRET="<32+ random chars>"
BETTER_AUTH_URL="https://psova.org.pk"
# --- Registry crypto (SECURITY.md §2.2 — back these up offline!) ---
REGISTRY_ENCRYPTION_KEY="<base64 32 bytes>"
REGISTRY_INDEX_KEY="<base64 32 bytes, different>"
# --- Mail (hPanel → Emails: create e.g. registry@psova.org.pk) ---
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="registry@psova.org.pk"
SMTP_PASS="<mailbox password>"
SMTP_FROM="PSOVA Registry <registry@psova.org.pk>"
# --- Seed (only needed when running db:seed) ---
ADMIN_EMAIL="admin@psova.org.pk"
ADMIN_PASSWORD="<strong>"
ADMIN_NAME="PSOVA Admin"
# DOCKER_BUILD is NOT set on Hostinger (standalone off → `next start` works)
```

Generate keys: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
(run twice). **Store both keys + BETTER_AUTH_SECRET in the owner's password manager AND an
offline sealed copy — losing the encryption key destroys all patient PII permanently.**

## 4. Deploy the app (hPanel → Websites → Add Website → **Deploy Web App**)

1. Choose **GitHub** → authorize → select `jerryboganda/psova`, branch `main`.
   (Node app must be a NEW website entry; it can't be attached to an existing site.)
2. Framework: should auto-detect **Next.js**. Build command `npm run build`
   (runs `prisma generate` first via our script). Node version: **22**.
3. If detection fails → framework "Other": build `npm run build`, output `.next`,
   entry/start `npm start` (Next `next start` binds `process.env.PORT` automatically).
4. Import/set env vars (§3) **before** first successful build → Deploy.
5. Every `git push` to `main` now auto-builds and deploys. Use the **Restart** button after
   env-only changes plus Redeploy when required by hPanel.

## 5. Domain, SSL, email

1. Point domain/subdomain to the new website (hPanel domain assignment during creation).
2. SSL: hPanel → Security → SSL → install (auto Let's Encrypt) → force HTTPS.
3. Create mailbox `registry@…` (hPanel → Emails; Business plan includes 5 mailboxes) and use
   its credentials in SMTP vars. **Always send via authenticated SMTP** — script `sendmail`
   is capped (~100/day) and hurts deliverability.
4. Update `metadataBase` in `app/[locale]/layout.tsx` + sitemap/robots URLs to the final
   domain (currently `psova.polytronx.com`).

## 6. Launch checklist

- [ ] Migrations deployed; `SELECT VERSION();` noted (MariaDB)
- [ ] Admin seeded; login at `/en/registry/login` works over HTTPS
- [ ] Enroll a TEST patient → tracking code → status lookup OK
- [ ] phpMyAdmin spot-check: `registry_patient` PII columns show `v1.` ciphertext, never
      plaintext
- [ ] Verify test record in admin → appears in statistics only after threshold logic
- [ ] CSV export downloads; audit log shows `RECORD_VIEW_PII` + `EXPORT_CSV` rows
- [ ] Confirmation email received (check spam; set SPF/DKIM in hPanel → Emails if flagged)
- [ ] `/ur/registry` RTL spot-check on mobile
- [ ] robots.txt blocks `/registry/admin`; delete TEST record afterwards (erasure flow)
- [ ] Keys backed up offline by owner ✔ (sign-off)

## 7. Operations

| Task | How |
|---|---|
| Deploy new version | `git push` → auto build; watch hPanel deploy log |
| Change env var | hPanel env editor → Redeploy |
| Restart app | hPanel website dashboard → Restart |
| DB browse | hPanel → phpMyAdmin (ciphertext only — decryption happens in-app) |
| Backups | hPanel → Files → Backups (weekly auto on Business); test a DB restore once |
| New migration | update schema → `prisma migrate dev` locally → commit → run
  `prisma migrate deploy` via Remote MySQL (§2) → push code |
| Logs | hPanel web app dashboard → runtime/deploy logs |
| Resource watch | hPanel usage graphs; app shares 3 GB RAM/2 cores with any other sites on the plan — keep other sites static |

## 8. Known limitations & fallbacks

- **WebSockets**: not documented/guaranteed — registry uses none. ✔
- **In-memory rate limits** reset on restart/redeploy — acceptable v1.
- **Build pipeline quirks** (if Hostinger's builder chokes on Next 16): fallback A — framework
  "Other" with explicit commands (§4.3); fallback B — deploy to the existing polytronx VPS
  via Docker (`DOCKER_BUILD=1 docker compose up -d --build`, compose file already in repo)
  and point DNS there instead. Code supports both without changes.
- **Prisma engines**: `binaryTargets` includes `debian-openssl-3.0.x`; if the build image
  differs, add the target Prisma names in its error message and redeploy.
- **No cron needed** in v1 (stats use ISR). If later needed: hPanel → Advanced → Cron Jobs
  hitting an authenticated API route.
