# PSOVA Verification Report

**Engineering verification date:** 2026-08-14
**Branch:** `feature/psova-tauri-mobile`
**Verified commit:** `6c51e76566f5a5ceab8ae78f015b544ad8b0b22f`

## Completed local evidence

| Gate | Result |
|---|---|
| Content snapshot | Generated and checksum/schema validation passed. |
| Strict TypeScript | Website, mobile, domain, content, UI, and test utilities passed. |
| ESLint | Website, mobile source/tests, packages, API, and tooling passed with zero warnings. |
| Shared/API tests | 18 tests passed, including schemas, content, search/sync/URL rules, contact validation, provider acceptance semantics, duplicate retry, size limits, and honeypot handling. |
| Mobile component tests | 3 journeys passed: first-run bundled content/library, immediate Urdu RTL switch, and placeholder phone suppression. |
| Coverage gate | Shared executable contracts/transforms passed configured 80% statement/function/line and 65% branch thresholds. |
| Website build | Next.js 16.3.1 production build passed with existing localized routes plus versioned APIs. |
| Mobile web build | Vite/Tauri frontend production build passed; main bundle was approximately 377 kB uncompressed / 120 kB gzip. |
| Dependency audit | `npm audit --omit=dev --audit-level=high` reported zero production findings after patch upgrades. |
| Visual QA | English and Urdu Home/Library/Directory captured at a true 430×932 CSS viewport; capture rejects `scrollWidth > 430`. |
| Existing website | Original 45 localized/static pages preserved; locale middleware migrated to supported Next.js proxy. |

## Clean CI and native build evidence

Windows lacked Microsoft C++ Build Tools, Java, and Android SDK at baseline, so native compilation was moved to reproducible GitHub Actions as requested. All three final workflows passed against the same commit.

| Workflow | Run | Verified result |
|---|---|---|
| Quality gates | `31810765236` | Prisma generation, content validation, lint, strict typecheck, all tests/coverage, Next.js build, mobile Vite build, and production audit passed. |
| Android mobile build | `31810765272` | Java 17, API 36, NDK 28.2, Rust Android target, Tauri Android init, arm64 debug APK build, and artifact upload passed. |
| iOS mobile build | `31810765265` | macOS/Xcode 26, Rust aarch64 simulator target, CocoaPods, Firebase Swift package, focused push plugin, Tauri iOS init, simulator app build, and artifact upload passed. |

The retained artifacts are named `psova-android-debug-6c51e76566f5a5ceab8ae78f015b544ad8b0b22f` and `psova-ios-simulator-6c51e76566f5a5ceab8ae78f015b544ad8b0b22f`. Android and iOS clean compilation is no longer a release blocker; signed physical-device/store builds still require owner-controlled credentials and the manual matrix below.

## Required physical/simulator matrix

| Area | Android evidence required | iOS evidence required |
|---|---|---|
| Install/upgrade | API 24 lower-end emulator and current Android device; upgrade over previous build. | Small and large current iPhone simulators plus one signed device; upgrade over TestFlight build. |
| Offline/recovery | First run in airplane mode, process kill, corrupt cache recovery, low storage. | Same, including WebView process termination. |
| Localization | English/Urdu, large font, screen rotation policy, TalkBack, reduced motion. | English/Urdu, Dynamic Type, VoiceOver, reduced motion. |
| Native actions | Call, WhatsApp, directions, safe website failure, back button. | Call, WhatsApp, directions, safe website failure, swipe/back navigation. |
| Contact | Draft offline, terminate, restore network, one provider acceptance, duplicate retry, provider outage. | Same. |
| Push | Denied permission, consented registration, foreground/background/cold start, token rotation, invalid token. | Same plus APNs entitlement/profile validation. |
| Security | Capability-denied command, unapproved URL, no plaintext journal, local-data deletion. | Same plus Keychain/backup inspection if journal is ever approved. |

## Release blockers

A public release is blocked until Android and iOS workflows pass, signed artifacts install, Firebase/Resend/KV production credentials are configured, PSOVA approves clinical/Urdu/directory/privacy/store content, device accessibility testing is recorded, and owner confirmation is given for store submission. These are owner/platform gates rather than hidden engineering success claims.
