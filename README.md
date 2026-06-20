# PSOVA — Pakistan Society Of Vascular Anomaly

A world-class, bilingual (English / اردو), heavily 3D-animated website for Pakistan's first
society for vascular anomalies. Built to raise awareness, help families **find specialist care
across Pakistan**, and educate with a plain-language, clinician-grounded condition library.

> **Tagline:** Common. Treatable. You are not alone.

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript) — SSG, deployable to Vercel
- **Tailwind CSS v4** — CSS-variable design tokens, dark-first, glassmorphism + neon glow
- **React Three Fiber + drei + postprocessing** — three signature WebGL scenes
- **GSAP + Lenis** — smooth scroll; **Framer Motion** — reveals, page transitions, micro-interactions
- **next-intl** — full EN/UR routing with right-to-left support and Urdu (Nastaliq) typography
- **React Hook Form + Zod** — accessible, validated forms

## Signature 3D / motion

- **Hero vessel network** — instanced glowing vessels with flowing particle "cells" (`components/three/VesselNetwork.tsx`)
- **Interactive anatomy explorer** — holographic figure with clickable condition hotspots (`components/three/AnatomyFigure.tsx`)
- **Pakistan particle map** — particles assemble into the country with glowing care-centre nodes that filter the directory (`components/three/PakistanMap.tsx`)
- Plus animated gradients, magnetic buttons, scroll reveals, a scroll-progress bar, and route transitions.

All 3D is quality-tiered (GPU detection), lazy-mounted, DPR-clamped, and **suppressed for
`prefers-reduced-motion`** users, who get a static gradient poster instead.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /en
npm run build    # production build (static)
npm start        # serve the production build
```

## Project structure

```
app/[locale]/            Localised routes (home, about, conditions, find-a-specialist, …)
app/api/contact/         Form intake endpoint (validates; wire an email provider to deliver)
components/three/         WebGL scenes + SceneCanvas (lazy, tiered, reduced-motion aware)
components/ui/            Design-system primitives (Button, GlassCard, Section, Reveal, …)
components/sections/home/ Home page sections
components/{conditions,directory,news,forms,layout}/
data/                     Bilingual content: conditions, centers, news, glossary, site, nav
i18n/                     next-intl routing/request/navigation
messages/{en,ur}.json     UI strings
```

## Before going live (placeholders to replace)

This build ships with **representative placeholder content**. Replace/verify:

1. **Org details** — logo, real board/team, contacts (`data/site.ts`), social links, registration status.
2. **Care directory** — every entry in `data/centers.ts` is marked representative and **must be
   verified with the institution** before publication (phone numbers are placeholders).
3. **Medical content** — `data/conditions.ts` is grounded in the ISSVA classification but must be
   **reviewed by a clinician**; a disclaimer is shown site-wide.
4. **Urdu** — translations are a strong first pass and should be **reviewed by a native speaker**.
5. **Forms** — `app/api/contact/route.ts` validates and logs submissions; connect an email
   provider (e.g. Resend) to actually deliver them.
6. **Donations** — the Donate/Get-Involved CTAs link to Contact; wire a real donation channel.

## Deployment

Deploy to **Vercel** (zero-config for Next.js). Set the production domain in
`app/[locale]/layout.tsx` (`metadataBase`), `app/sitemap.ts`, and `app/robots.ts`.

---

*A non-profit initiative. General information only — not a substitute for professional medical advice.*
