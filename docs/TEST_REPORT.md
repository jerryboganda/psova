# PSOVA Verification Report

**Engineering verification date:** 2026-08-14
**Branch:** `feature/psova-tauri-mobile`

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

## Native build evidence

Windows lacked Microsoft C++ Build Tools, Java, and Android SDK at baseline. Native compilation was therefore moved to reproducible GitHub Actions as requested. `mobile-android.yml` provisions Java 17, API 36, NDK 28.2, Rust targets, initializes Tauri Android, and builds an arm64 debug APK. `mobile-ios.yml` provisions macOS/Xcode, Rust Apple targets, CocoaPods, initializes Tauri iOS, and builds an aarch64 simulator app. A milestone is not a release candidate until those clean workflows pass and their artifacts are installed.

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
