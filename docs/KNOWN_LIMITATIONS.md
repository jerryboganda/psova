# Known Limitations and Release Gates

| Item | Current behavior | Resolution owner / release effect |
|---|---|---|
| Directory verification | Representative records are visibly labeled; placeholder phones are removed. | PSOVA/institutions must verify records. Do not relabel without evidence. |
| Medical review | Content is structured and source-aware but not signed off in this repository. | PSOVA clinician approval blocks public medical claims. |
| Urdu review | Full UI/content exists and RTL is tested, but native-speaker/clinical review is outstanding. | PSOVA language reviewer blocks final listing copy. |
| Organization/support metadata | Email, address, social URLs, registration status, and final privacy/support URLs need confirmation. | PSOVA owner blocks store submission. |
| Donations/payments | Only pledge/contact is available; placeholder bank/wallet/card data is never shown by mobile. | A separate approved payment integration is required. |
| Contact delivery | Sent through the Hostinger mailbox (SMTP_*, same as the registry); idempotency ledger and rate limits live in the Hostinger MariaDB (`kv_entry`, self-creating). No external service. | Needs `SMTP_*` and `DATABASE_URL` set in hPanel (already used by the registry). |
| Remote push | Registration is stored encrypted in the Hostinger MariaDB. Delivery to phones needs Google FCM (APNs for iOS), which cannot run on Hostinger; it stays disabled until Firebase env vars are set. Local notifications and everything else work without it. | Only external dependency; optional. |
| Universal links | Custom `psova://` links work; verified HTTPS links are deferred. | Domain/signing ownership is required. |
| Child record | Locked and disabled; no note/photo capture is reachable. | Privacy and clinical gate in `JOURNAL_SECURITY.md` blocks activation. |
| Native artifact evidence | Clean quality, Android arm64 debug APK, and iOS aarch64 simulator builds passed at commit `6c51e76566f5a5ceab8ae78f015b544ad8b0b22f`; retained artifacts were produced. | Signed physical-device/AAB/IPA evidence still requires owner signing credentials and the manual device matrix. |
| Store publication | Workflows prepare signed files but never upload or publish. | Explicit user/owner confirmation is required at the external action boundary. |
| Crash analytics | No third-party crash/analytics SDK is bundled, minimizing data collection. | If added later, privacy disclosures and redaction tests must be updated. |

No known website, mobile-web, Android compile, iOS simulator compile, shared-contract, content-validation, or production dependency-audit blocker remains in the source tree. The table above is the canonical list of external approval/configuration evidence still required for a public release.
