# Known Limitations and Release Gates

| Item | Current behavior | Resolution owner / release effect |
|---|---|---|
| Directory verification | Representative records are visibly labeled; placeholder phones are removed. | PSOVA/institutions must verify records. Do not relabel without evidence. |
| Medical review | Content is structured and source-aware but not signed off in this repository. | PSOVA clinician approval blocks public medical claims. |
| Urdu review | Full UI/content exists and RTL is tested, but native-speaker/clinical review is outstanding. | PSOVA language reviewer blocks final listing copy. |
| Organization/support metadata | Email, address, social URLs, registration status, and final privacy/support URLs need confirmation. | PSOVA owner blocks store submission. |
| Donations/payments | Only pledge/contact is available; placeholder bank/wallet/card data is never shown by mobile. | A separate approved payment integration is required. |
| Contact delivery | Adapter is complete but production success requires Resend and durable KV configuration. | Infrastructure owner blocks production contact acceptance. |
| Remote push | FCM/APNs adapters and token security are implemented; platform configuration/secrets and device tests remain. | Firebase/Apple owners block live push. |
| Universal links | Custom `psova://` links work; verified HTTPS links are deferred. | Domain/signing ownership is required. |
| Child record | Locked and disabled; no note/photo capture is reachable. | Privacy and clinical gate in `JOURNAL_SECURITY.md` blocks activation. |
| Native artifact evidence | Local Vite/web verification is green; native clean builds run in GitHub Actions. | CI must pass and artifacts must be installed before release-candidate status. |
| Store publication | Workflows prepare signed files but never upload or publish. | Explicit user/owner confirmation is required at the external action boundary. |
| Crash analytics | No third-party crash/analytics SDK is bundled, minimizing data collection. | If added later, privacy disclosures and redaction tests must be updated. |

No known website, mobile-web, shared-contract, content-validation, or production dependency-audit blocker remains in the source tree. The table above is the canonical list of external approval/configuration evidence still required for a public release.
