# Secure Child Record — Approval Gate and Threat Model

The child-record capability is **disabled in release builds**. The Rust command `journal_feature_enabled` returns `false`, the UI presents a locked row, and no screen can create health notes or photos. Enabling it requires written PSOVA clinical and privacy approval, finalized consent language, retention policy, device-recovery policy, and completed Android/iOS security tests.

## Protected information and trust boundary

If approved, the feature may hold timestamped notes, reminders, and lesion photographs. This information must remain local by default. The mobile WebView may render decrypted content only after biometric or owner-approved PIN authentication. Tauri Store is not permitted for journal payloads. SQLite may hold encrypted blobs and non-sensitive scheduling metadata; encryption keys must be generated per installation and wrapped by Stronghold or the platform keychain/keystore. No fixed key, API key, app identifier, device ID, or user-entered PIN may be used directly as encryption material.

## Required controls before activation

| Control | Required evidence |
|---|---|
| Consent | Versioned bilingual consent and “not a diagnostic tool” acknowledgement, with withdrawal and delete behavior. |
| Authentication | Biometric status and authentication tested on supported Android/iOS devices; failures close access rather than bypass it. |
| Encryption | Authenticated encryption for notes/photos, per-file nonce, per-installation key, and secure key wrapping. |
| Storage | App-private paths only, no gallery/cloud backup by default, no plaintext temp files after processing. |
| Telemetry | Notes, photos, names, dates, paths, and encryption material excluded from logs, analytics, crash reports, and push payloads. |
| Deletion | Database blobs, encrypted files, thumbnails, reminders, and wrapped keys deleted; behavior verified after restart. |
| Export | Explicit re-authentication, clear warning that exported files leave app protection, and owner-selected destination only. |
| Recovery | Honest local-only backup warning. No undocumented server copy or account-based recovery. |
| Testing | Process death, low storage, interrupted write, corrupt blob, failed biometric, screenshot policy, OS backup, upgrade, export, and delete tests. |

## Non-goals

The record will not diagnose an image, recommend treatment, sync to PSOVA or a clinician, create a national registry, or send health details in notifications. Any cloud synchronization, clinician sharing, or AI interpretation is a separate medical/privacy product requiring a new approved design.
