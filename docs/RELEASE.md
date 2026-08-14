# Mobile Release Guide

## Build strategy

CPU-intensive quality and native builds run in GitHub Actions. The local Windows machine needs only fast TypeScript/Vite checks for normal development. Pull requests run the shared quality workflow and platform workflows when relevant files change.

| Workflow | Runner | Unsigned result |
|---|---|---|
| Quality gates | Ubuntu 24.04 | Website/mobile builds, tests, coverage, audit evidence. |
| Android mobile build | Ubuntu 24.04, Java 17, API 36, NDK 28.2 | Debug arm64 APK and generated Android project. |
| iOS mobile build | macOS 26 / Xcode 26 | aarch64 simulator app and generated Apple project. |
| Signed mobile release | Protected Ubuntu/macOS environments | Signed AAB and IPA artifacts, not store publication. |

## Required protected secrets

| Platform | Secret |
|---|---|
| Android | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_SERVICES_JSON_BASE64` |
| iOS | `IOS_DISTRIBUTION_CERTIFICATE_BASE64`, `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`, `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_ID`, `APPSTORE_PRIVATE_KEY`, `GOOGLE_SERVICE_INFO_PLIST_BASE64` |

Store credentials in the `mobile-release` GitHub environment with required reviewers. Use separate development and production Firebase projects. Do not reuse service-account private keys as mobile configuration.

## Versioning

Keep `package.json`, `apps/mobile/package.json`, `apps/mobile/src-tauri/tauri.conf.json`, the Rust crate version, and store versions synchronized. Every uploaded store binary needs a new build number even when its marketing version is unchanged. Tag the exact accepted commit after CI is green.

## Release sequence

1. Obtain written owner approval for brand, medical copy, Urdu, directory verification policy, privacy text, support address, and final store metadata.
2. Run the quality, Android, and iOS workflows from the candidate commit. Download and hash the artifacts.
3. Install the Android debug artifact and iOS simulator artifact. Complete the device matrix in `TEST_REPORT.md`, including notification denial, cold-start links, offline launch, Urdu, large text, and process restart.
4. Run the signed release workflow using the protected environment. Verify AAB/IPA signatures and package identifier `pk.org.psova.mobile`.
5. Upload first to Play internal testing and TestFlight internal testing. Upload is an external action requiring explicit owner confirmation.
6. Resolve every release blocker, repeat the gates, then expand to a limited external cohort. Production promotion requires a second explicit owner confirmation.

The repository does not automate store publishing. This prevents an engineering push from representing PSOVA publicly without the final legal/account approval.

## Native push checklist

Android requires a Firebase app matching `pk.org.psova.mobile`; iOS requires a matching Firebase app, APNs key/certificate, Push Notifications capability, background remote-notification mode where used, and an App Store profile carrying those entitlements. Verify token rotation after reinstall and provider invalid-token cleanup. The code never requests notification permission at launch.

## Universal links

The custom `psova://` scheme is release-ready. Do not enable universal/app links until the final HTTPS domain is owned and serves correct `apple-app-site-association` and `assetlinks.json` documents with production signing fingerprints.

## Rollback

Pause rollout rather than deleting an active store version. Android supports staged rollout halt and promotion of a corrected higher version; Apple supports removing a build from review/TestFlight distribution and submitting a corrected build. Backend content can be rolled back independently because clients retain their last valid snapshot.
