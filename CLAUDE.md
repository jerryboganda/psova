# CLAUDE.md — PSOVA Repository Guide

Guidance for AI coding agents (Claude Code) working in this repository.

## What this project is

**PSOVA — Pakistan Society Of Vascular Anomaly** (`psova.polytronx.com`, target production
host: **Hostinger Business shared hosting**). A bilingual (English / اردو Urdu, full RTL),
heavily animated Next.js website for Pakistan's first vascular-anomaly society, now being
extended with the **NVAR — National Vascular Anomaly Registry** (Pakistan's first national
patient registry for vascular anomalies).

## Commands

```bash
npm run dev        # dev server → http://localhost:3000 (redirects to /en)
npm run build      # production build (includes prisma generate once registry is wired)
npm start          # serve production build
npx tsc --noEmit   # QUICK typecheck — preferred verification during development
npx prisma migrate dev     # create/apply migrations locally (registry)
npx prisma generate        # regenerate Prisma client
npx prisma db seed         # seed admin user
```

**Verification policy (owner's explicit instruction): do NOT run long builds or CI flows
repeatedly. Use `npx tsc --noEmit` for quick checks while coding. Run `npm run build` at most
once at the very end as a sanity check. The owner tests runtime behaviour themselves.**

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript strict) — `output: 'standalone'` must be
  conditional on `DOCKER_BUILD` env (Hostinger's managed Node.js pipeline uses `next start`)
- **Tailwind CSS v4** — design tokens as CSS variables in `app/globals.css` under `@theme`
- **next-intl v4** — locales `['en','ur']`, `localePrefix: 'always'`, Urdu is RTL
  (`i18n/routing.ts`); middleware in `middleware.ts` (matcher excludes `/api`)
- **React Hook Form + Zod v4** + `@hookform/resolvers` — all forms
- **Framer Motion** (reveals/transitions), **GSAP + Lenis** (smooth scroll), **R3F/three**
  (3D scenes; never import three in server components)
- **Registry additions:** **Prisma ORM (mysql provider → Hostinger MariaDB)**, **Better Auth**
  (email/password, roles `admin`/`clinician`), **Nodemailer** (Hostinger SMTP), field-level
  **AES-256-GCM** encryption for patient PII

## Project structure

```
app/[locale]/…               localized pages (about, conditions, find-a-specialist, …)
app/[locale]/registry/…      NVAR pages (public, clinician, admin) ← registry work
app/api/contact/route.ts     existing form intake pattern (zod safeParse → JSON)
app/api/auth/[...all]/       Better Auth handler (registry)
app/api/registry/…           registry API routes
components/ui/               design primitives: Button, GlassCard, Section, Reveal,
                             PageHeader, GradientText, Accordion, Magnetic
components/forms/            ContactForm/AskExpertForm/DonateForm — copy their patterns
components/registry/         registry components (new)
components/three/            WebGL scenes (lazy, GPU-tiered) — do not touch for registry
data/*.ts                    bilingual static content; conditions.ts has the 8 condition slugs
lib/registry/                db.ts, crypto.ts, codes.ts, mailer.ts, rate-limit.ts, audit.ts
prisma/schema.prisma         database schema (registry)
i18n/                        routing/request/navigation — use `Link` etc. from i18n/navigation
messages/{en,ur}.json        ALL UI strings live here; never hardcode user-facing text
docs/registry/               ★ NVAR specification documents — READ BEFORE REGISTRY WORK
```

## Conventions (follow strictly)

1. **i18n:** every user-facing string goes in `messages/en.json` AND `messages/ur.json` under a
   namespace; components use `useTranslations('Namespace')` (client) or
   `getTranslations` (server). Data files use `LocalizedString` = `{ en: string; ur: string }`.
2. **Navigation:** import `Link`, `useRouter`, `usePathname`, `redirect` from
   `@/i18n/navigation` — never from `next/link`/`next/navigation` for locale-aware routes.
3. **Styling:** Tailwind v4 utilities + CSS-variable tokens (`var(--color-cyan)` etc.).
   Reuse `components/ui/*` primitives. Dark-first glassmorphism. Registry UI must look
   native to the site — see `docs/registry/UI-SPEC.md`. No new UI/chart libraries.
4. **Forms:** RHF + `zodResolver`, the shared `field` input class pattern from
   `components/forms/ContactForm.tsx`, status state machine `idle|sending|success|error`.
5. **API routes:** validate with Zod `safeParse`, return `NextResponse.json`, never throw raw.
6. **Server/client split:** pages are server components by default; `'use client'` only where
   interaction/state is needed. `setRequestLocale(locale)` in every page for SSG.
7. **Path alias:** `@/*` → repo root.
8. **RTL:** use logical properties/classes (`start-`/`end-`, `ms-`/`me-`); icons that imply
   direction get `rtl:-scale-x-100`.

## Registry — critical guardrails

- **NEVER log, console.log, or return decrypted PII** except in the authenticated admin
  detail/export paths specified in `docs/registry/API-SPEC.md`. Every decrypt-for-display is
  audit-logged.
- **All PII fields are AES-256-GCM encrypted** via `lib/registry/crypto.ts` before Prisma
  writes; lookups use HMAC blind-index columns. See `docs/registry/SECURITY.md`.
- **Never commit** `.env*`, keys, or dumps. `.env.example` documents required vars.
- Public statistics obey **k-anonymity (suppress counts < 5)**.
- Patients do **not** get accounts — enrollment returns a tracking code.
- No file/photo uploads in v1.
- Keep `connection_limit=5` in `DATABASE_URL` (Hostinger shared MySQL cap).

## NVAR documentation index (read in this order for registry work)

| Doc | Purpose |
|---|---|
| `docs/registry/PRD.md` | Product requirements: personas, stories, flows, acceptance criteria |
| `docs/registry/ARCHITECTURE.md` | System design, module map, request flows, decisions |
| `docs/registry/DATA-MODEL.md` | Complete Prisma schema + encryption/index map |
| `docs/registry/SECURITY.md` | Encryption spec, key mgmt, RBAC, audit, threat model |
| `docs/registry/API-SPEC.md` | Every endpoint: schema, auth, errors, rate limits |
| `docs/registry/UI-SPEC.md` | Every page/component, message keys, design mandate, RTL |
| `docs/registry/TASKS.md` | ★ Phase-by-phase implementation checklist (P1→P8) |
| `docs/registry/DEPLOYMENT-HOSTINGER.md` | Exact Hostinger hPanel deployment runbook |

Work phase-by-phase per `TASKS.md`; commit at the end of each phase with a
`registry(pN): description` message. Push to `https://github.com/jerryboganda/psova` when done.
