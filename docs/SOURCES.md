# Engineering Sources

The implementation was checked against current official documentation rather than inferred from package names.

| Topic | Source | Applied decision |
|---|---|---|
| Tauri mobile plugin development | https://v2.tauri.app/develop/plugins/develop-mobile/ | Kotlin `@TauriPlugin`/`@Command`, Swift `Plugin`/`Invoke`, mobile plugin registration, permission generation, and Android NDK 28+ 16 KB alignment guidance. |
| Tauri plugin architecture and permissions | https://v2.tauri.app/develop/plugins/ | Focused in-repository plugin, generated command permission, managed Rust state, and `plugin:<name>|<command>` API boundary. |
| Tauri capabilities | https://v2.tauri.app/security/capabilities/ | Mobile-only least-privilege capability and no remote API access. |
| Tauri deep links | https://v2.tauri.app/plugin/deep-linking/ | Static `psova://` custom scheme; verified HTTPS links deferred until association files and signing fingerprints exist. |
| Tauri SQL | https://v2.tauri.app/plugin/sql/ | SQLite connection, Rust-registered transactional migration, and explicit execute permission. |
| Tauri with Vite | https://v2.tauri.app/start/frontend/vite/ | Fixed dev port, `TAURI_DEV_HOST`, WebView build targets, and `frontendDist`. |
| Tauri release prerequisites | https://v2.tauri.app/start/prerequisites/ | Android API 24 minimum, iOS 15 minimum, and native toolchains delegated to CI. |
| Tauri platform configuration | https://v2.tauri.app/reference/config/ | Bundle identifier, Android/iOS minimum versions, CSP, and plugin configuration. |

Provider operations additionally use documented Resend idempotency/webhook verification semantics, Upstash-compatible Redis REST commands, Google service-account OAuth 2.0 JWT bearer exchange, and FCM HTTP v1 message delivery. Production account configuration and terms must be rechecked by the owner at release time because those external services can change independently of this source tree.
