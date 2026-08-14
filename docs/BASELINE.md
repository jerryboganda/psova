# PSOVA Pre-Implementation Baseline

**Recorded:** 2026-08-14
**Source branch at inspection:** `main`, ten commits behind the locally known `origin/main` reference
**Protected user file:** `PSOVA Project — In-Depth Analysis.md` was untracked before implementation and must not be overwritten or committed without owner direction.

## Environment

| Tool | Baseline result |
|---|---|
| Node.js | 25.6.1 |
| npm | 11.9.0 |
| Rust | 1.96.1 |
| Cargo | 1.96.1 |
| Java | Not installed/configured |
| Android SDK | `ANDROID_HOME` and `ANDROID_SDK_ROOT` unset |

## Website Checks

| Check | Result | Classification |
|---|---|---|
| `npm ci` | Passed; 148 packages installed | Baseline pass |
| `npm run build` | Passed; 45 static pages generated plus the dynamic contact API | Baseline pass |
| `npx tsc --noEmit` | Passed | Baseline pass |
| `npm run lint` | Failed because `next lint` is no longer a valid Next.js 16 lint command and is interpreted as a project directory | Pre-existing tooling defect |
| `npm audit` summary | Five findings reported: one moderate and four high | Pre-existing dependency findings; exact actionable paths to be audited after workspace migration |

The Next.js build also reports that the `middleware` file convention is deprecated in favor of `proxy`. This is a pre-existing warning and will be corrected during hardening.

## Content Safety Baseline

The repository itself marks the specialist directory, news, medical content review, Urdu review, organization metadata, social links, and most donation channels as representative, placeholder, or awaiting owner review. Mobile release logic must therefore suppress placeholder payment channels, clearly label unverified directory records, and keep the secure child-record feature disabled until its clinical/privacy gate is approved.
