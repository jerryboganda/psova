# KICKOFF PROMPT — paste this into Claude Code to start implementation

---

You are implementing the **NVAR — National Vascular Anomaly Registry** for the PSOVA
website (Pakistan Society Of Vascular Anomaly) in this repository. This is a complete,
pre-approved specification — your job is disciplined execution, not re-design.

## Step 1 — Study (before writing any code)

Read, in this exact order:
1. `CLAUDE.md` — repository conventions, commands, guardrails
2. `docs/registry/README.md` — document index & precedence rules
3. `docs/registry/PRD.md` — requirements & acceptance criteria
4. `docs/registry/ARCHITECTURE.md` — system design & module map
5. `docs/registry/DATA-MODEL.md` — complete Prisma schema (copy as specified)
6. `docs/registry/SECURITY.md` — encryption/key/RBAC/audit rules (NORMATIVE — never deviate)
7. `docs/registry/API-SPEC.md` — every endpoint contract
8. `docs/registry/UI-SPEC.md` — every page, component, i18n key, design mandate
9. `docs/registry/TASKS.md` — your phase-by-phase execution checklist

Also skim these existing files to absorb the house style before coding:
`app/[locale]/contact/page.tsx`, `components/forms/ContactForm.tsx`,
`components/ui/*.tsx`, `app/api/contact/route.ts`, `i18n/*.ts`, `messages/en.json`
(structure), `data/conditions.ts` (slugs), `app/globals.css` (tokens).

## Step 2 — Execute phase by phase

Work through `docs/registry/TASKS.md` **P1 → P8 in order**. For each phase:
- Complete every checklist item.
- Verify with `npx tsc --noEmit` only (owner's rule: NO repeated full builds, no test
  scaffolding, no CI files — a single `npm run build` happens once, in P8).
- Commit at the phase gate: `registry(pN): <summary>`.
- Then continue immediately to the next phase without waiting for permission.

## Step 3 — Ship (P8)

Final `tsc` + one `npm run build` sanity check, then push everything to
`https://github.com/jerryboganda/psova` (branch `main`).

## Hard rules (violations are bugs)

1. **Security spec is law**: all PII fields AES-256-GCM encrypted via `lib/registry/crypto.ts`
   before any DB write; HMAC blind indexes for lookup; every PII decrypt/export audit-logged;
   never log/return decrypted PII outside the specified admin/clinician/status paths;
   k-anonymity (<5 suppressed) on all public statistics.
2. **Bilingual always**: every user-facing string added to BOTH `messages/en.json` and
   `messages/ur.json` in the same task, with real Urdu translations (Nastaliq-appropriate,
   matching the site's existing register). RTL-safe layout (logical properties).
3. **Design system only**: reuse `components/ui/*` primitives and the tokens in
   `app/globals.css`; no new UI/chart/auth/state libraries beyond the dependency list in
   `ARCHITECTURE.md §10`.
4. **Never commit secrets**: `.env` stays untracked; `.env.example` uses placeholders.
5. If a library's current API differs slightly from the spec (e.g., better-auth minor
   changes), adapt while preserving the spec's intent, and note the deviation in the
   commit message.
6. If something is genuinely ambiguous, choose the option that best matches the existing
   codebase patterns, note it in the commit message, and keep moving.

**Definition of done**: all TASKS.md boxes checkable; `tsc --noEmit` clean; one successful
`npm run build`; enroll → verify → statistics flow works locally; pushed to GitHub.

Begin now with Step 1, then start P1.

---
