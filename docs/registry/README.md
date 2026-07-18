# NVAR — National Vascular Anomaly Registry · Documentation

Specification set for building Pakistan's first national vascular-anomaly patient registry
into the PSOVA website. Written to be executed end-to-end by an AI coding agent
(Claude Code) or a human engineer.

## Reading order

| # | Document | Answers |
|---|----------|---------|
| 0 | [`/CLAUDE.md`](../../CLAUDE.md) | How to work in this repo (conventions, commands, guardrails) |
| 1 | [`PRD.md`](./PRD.md) | What we're building & why — personas, stories, acceptance criteria |
| 2 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | How it's designed — modules, flows, auth, decisions |
| 3 | [`DATA-MODEL.md`](./DATA-MODEL.md) | Complete Prisma schema, enums, encryption map, transitions |
| 4 | [`SECURITY.md`](./SECURITY.md) | AES-256-GCM spec, keys, blind indexes, RBAC, audit, threat model |
| 5 | [`API-SPEC.md`](./API-SPEC.md) | Every endpoint with Zod schemas, auth, errors, rate limits |
| 6 | [`UI-SPEC.md`](./UI-SPEC.md) | Every page & component, design mandate, i18n keys, RTL/a11y |
| 7 | [`TASKS.md`](./TASKS.md) | ★ The build order — phases P1–P8 with gates |
| 8 | [`DEPLOYMENT-HOSTINGER.md`](./DEPLOYMENT-HOSTINGER.md) | Production runbook (hPanel, MySQL, env, SMTP) |
| 9 | [`KICKOFF-PROMPT.md`](./KICKOFF-PROMPT.md) | The prompt that starts implementation |

## Decision snapshot

Hybrid enrollment (families + clinicians, admin-verified) · MySQL/MariaDB + Prisma ·
Better Auth (admin/clinician; patients use tracking codes, no accounts) · full PII incl. CNIC
stored **AES-256-GCM encrypted** with HMAC blind indexes · public dashboard with k≥5
anonymity · bilingual EN/اردو, RTL, existing PSOVA design system · hosted on Hostinger
Business (hPanel Node.js) · repo `github.com/jerryboganda/psova`.

## Precedence

If documents conflict: **SECURITY.md > DATA-MODEL.md > API-SPEC.md > UI-SPEC.md > PRD.md**
(security is never traded for convenience). TASKS.md defines order, not requirements.
