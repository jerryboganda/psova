# UI-SPEC — NVAR Pages, Components & Design Mandate

**DESIGN MANDATE (non-negotiable):** the registry must be visually indistinguishable from the
rest of PSOVA. Reuse the existing design system 1:1 — no new UI kits, no chart libraries,
no new fonts/colors.

---

## 1. Design system inventory (reuse these)

**Tokens** (`app/globals.css` `@theme`): `--color-base-950…700` (deep indigo bg),
accents `--color-magenta #ff2d9b · --color-purple #8b3dff · --color-blue #3d6cff ·
--color-cyan #1fe0d4 · --color-rose #ff5d7e`, text `--color-fg/muted/faint`,
`--color-line` (borders), `--gradient-brand`, `--gradient-soft`, `--glow-magenta/cyan`,
`--radius-xl/2xl`, fonts `--font-display` (Sora) / `--font-body` (Inter) /
`--font-urdu` (Nastaliq) / `--font-urdu-body` (Naskh).

**Primitives** (`components/ui/`): `Button` (variants incl. gradient brand pill),
`GlassCard` (glassmorphism panel), `Section` (page section wrapper w/ spacing),
`PageHeader` (title/eyebrow/lede block used by every subpage), `Reveal` (scroll-in
animation), `GradientText`, `Accordion`, `Magnetic`.

**Form pattern** (`components/forms/ContactForm.tsx`): shared `field` class
(`rounded-2xl border-white/10 bg-white/5 …`), RHF + zodResolver, status state machine,
success panel with cyan check. Copy this style exactly.

**Layout:** pages render inside existing `Header`/`Footer`; use `Section` + `PageHeader`.
Respect `prefers-reduced-motion` (wrap animations in existing `Reveal`/MotionConfig).

## 2. New shared registry components (`components/registry/`)

| Component | Purpose |
|---|---|
| `RegistryBadge.tsx` | status pill: PENDING amber/white, VERIFIED cyan, REJECTED rose, DUPLICATE faint |
| `WizardShell.tsx` | step indicator (1–5, gradient progress), back/next, step animation (Framer) |
| `FormField.tsx` | label + input/select/textarea + bilingual error line (shared `field` class) |
| `ConsentCheck.tsx` | checkbox row with rich label + required marker |
| `TrackingCodeCard.tsx` | success screen: giant code, copy button, warning, status link |
| `StatCard.tsx` | GlassCard number+label (public stats + admin overview) |
| `BarList.tsx` | horizontal CSS bar chart (label, gradient bar, count or "<5"); a11y: sr-only table |
| `TrendLine.tsx` | inline SVG polyline for by-year trend (stroke `url(#brandGradient)`) |
| `DataTable.tsx` | admin/clinician table: sticky header, row hover, empty state, pagination controls |
| `AdminNav.tsx` | admin sidebar/tabs (overview, queue, records, clinicians, audit) |
| `LogoutButton.tsx` | client button → authClient.signOut → redirect login |

All bilingual, RTL-safe (logical props), keyboard accessible.

## 3. Pages

### 3.1 `/registry` — landing (public, static shell)
`PageHeader` (eyebrow "NVAR", gradient title, lede) → `Section` trio of `GlassCard`s
(Why a registry / Who can enroll / Your privacy — lock icon, "AES-256 encrypted" line) →
big CTA row (`Button` gradient → enroll; ghost → status; ghost → statistics) → "For
clinicians" strip (login/register link) → consent & privacy full text (Accordion) →
medical disclaimer. Add small registry CTA section on home page linking here.

### 3.2 `/registry/enroll` — wizard (client)
`WizardShell` 5 steps per PRD A2. Selects use curated lists from `constants.ts`
(provinces, districts free-text w/ datalist, conditions from `data/conditions.ts` slugs +
localized names via existing data, body sites, onset). CNIC input auto-formats
`#####-#######-#` ; phone placeholder `03XX XXXXXXX`. Step 4 consent checkboxes
(`ConsentCheck`). Step 5 review = definition list of entered values + edit-step links.
Submit → `TrackingCodeCard`. Honeypot: visually-hidden `website` input (`aria-hidden`,
`tabIndex={-1}`, `autoComplete="off"`).

### 3.3 `/registry/status` — lookup (client form)
Two fields (code, phone) → result panel: `RegistryBadge` + submitted date + first name +
publicReason if rejected + guidance copy. Errors: uniform "not found" message.

### 3.4 `/registry/statistics` — public dashboard (server, ISR 1h)
If `published:false` → "Data collection in progress" GlassCard (still show totals row).
Else: 4 `StatCard`s → `BarList` by province → `BarList` by condition (localized condition
names) → two-column: gender split + age bands → `TrendLine` by year → data notes
(k-anonymity explanation, VERIFIED-only, updated hourly).

### 3.5 `/registry/login` — auth (client)
Tabs: **Sign in** (email/password) · **Clinician registration** (fields per API-SPEC §1).
Post-login redirect by role: admin → `/registry/admin`, clinician → `/registry/clinician`.
Unapproved clinician → pending screen (in clinician layout). Generic error copy.

### 3.6 Clinician
- layout: guard + slim sub-nav (My cases · New case · Logout)
- `/registry/clinician`: `DataTable` own cases; pending-approval state screen when
  `!approved` (icon + copy + contact link)
- `/registry/clinician/new-case`: wizard reusing steps 1–2 + clinical step (ISSVA select,
  severity, basis, treatments repeater with add/remove rows, notes textarea) + attestation
  step → `TrackingCodeCard` (with "give this code to the family" note)

### 3.7 Admin (`/registry/admin/**`)
- layout: guard + `AdminNav` + compact density
- overview: 4 `StatCard` (pending/verified/rejected/clinician-pending) + recent 10 table
- queue: `DataTable` PENDING oldest-first, filters (province, condition, source) as select
  pills; row → detail
- records: same table w/ full filters + exact-search box (select: code/CNIC/phone) +
  export button (opens confirm dialog → hits export URL)
- records/[id]: two-column — left: decrypted PII in `GlassCard` "Protected data" (subtle
  rose border + lock icon, fields as definition list); right: diagnosis/treatments/consents/
  meta; duplicate banner (amber GlassCard listing candidate links) when `possibleDuplicate`;
  action bar: Verify (cyan), Reject (rose, opens dialog w/ publicReason + internalNote),
  Mark duplicate (dialog w/ canonical code input); each action → confirm → toast (reuse
  simple inline status pattern, no toast lib — status banner)
- clinicians: table (name, PMC no. decrypted, specialty, facility, city, province, date) +
  Approve/Reject buttons w/ confirm
- audit: read-only `DataTable` (time, actor, role, action, entity, ip) + filters

## 4. i18n message keys (add to BOTH `messages/en.json` and `messages/ur.json`)

Namespaces (structure; Claude fills complete bilingual values — Urdu must be real
translations in register consistent with existing site tone, not transliteration):

```
Nav.registry                    "National Registry" / "قومی رجسٹری"
Registry.*                      landing: eyebrow,title,lede,whyTitle,whyBody,whoTitle,whoBody,
                                privacyTitle,privacyBody,ctaEnroll,ctaStatus,ctaStats,
                                clinicianStrip,clinicianCta,consentHeading,consentBody…,
                                disclaimer
RegistryEnroll.*                stepLabels.{1..5}, every field label+placeholder+error,
                                consent texts, review headings, submit, success.{title,save,
                                copy,copied,statusLink,emailNote}
RegistryStatus.*                title,lede,codeLabel,phoneLabel,check,notFound,
                                status.{PENDING,VERIFIED,REJECTED,DUPLICATE},submittedOn,
                                reasonLabel,help
RegistryStats.*                 title,lede,cards.{total,provinces,clinicians,conditions},
                                charts.{province,condition,gender,age,trend},suppressed,
                                notes,inProgress,updated
RegistryAuth.*                  signIn,register,email,password,name,pmc,specialty,facility,
                                city,province,submit,pendingTitle,pendingBody,errors.generic
RegistryClinician.*             nav.{cases,new,logout},casesTitle,empty,newCaseTitle,
                                clinical field labels,attestation,successNote
RegistryAdmin.*                 nav.*,overview.*,queue.*,records.* (filters,search,table
                                headers),record.* (protectedData,actions,verify,reject,
                                duplicate,publicReason,internalNote,confirm…),clinicians.*,
                                audit.*,export.{button,confirmTitle,confirmBody}
RegistryCommon.*                back,next,submit,loading,copy,copied,requiredMark,optional,
                                page,of,provinces.{PUNJAB,…},genders.*,onsets.*,bodySites.*,
                                ageBands.*,issva.*,severity.*,treatmentTypes.*,outcomes.*
```

Rules: reuse `Common.*` keys where they exist; enum labels ONLY via `RegistryCommon`
(never render raw enum). Urdu numerals: keep Western digits for codes/phones.

## 5. RTL & accessibility checklist

- Logical utilities only (`ps-/pe-/ms-/me-/start-/end-`); wizard progress and back/next
  arrows flip via `rtl:-scale-x-100`.
- Urdu headings automatically use `--font-urdu` (existing global h1–h5 rule) — verify
  line-height on Nastaliq for wizard labels (`leading-relaxed` on `ur`).
- Every input: `<label htmlFor>` (registry forms upgrade from aria-label pattern to visible
  labels — medical forms need them), error text linked via `aria-describedby`,
  `aria-invalid` on error.
- Wizard: step change moves focus to step heading (`tabIndex={-1}` + `.focus()`),
  `aria-current="step"` on indicator.
- Charts: each has visually-hidden `<table>` with the same data; suppressed cells read
  "fewer than five".
- Dialogs: focus trap, `Escape` close, `aria-modal` (build small `Dialog` in
  `components/registry/` if none exists — headless, styled with GlassCard).
- Color contrast: counts/labels use `--color-fg` on glass; never faint-on-glass for data.
- Touch targets ≥ 44px on wizard controls (mobile-first families).

## 6. States

Every data view implements: loading (skeleton shimmer via `animate-pulse` on glass blocks),
empty (icon + localized copy), error (rose GlassCard + retry), success. Forms disable
submit while `sending` with `Loader2` spinner (existing pattern).
