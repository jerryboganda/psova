# PSOVA Store Package

This package is an engineering-ready draft. PSOVA must approve final organization identity, medical copy, Urdu, privacy/support URLs, directory status, and legal disclosures before submission.

## Listing metadata

| Field | English | Urdu |
|---|---|---|
| App name | PSOVA | پی ایس او وی اے |
| Subtitle | Vascular anomaly information and care navigation | ویسکولر ایناملی معلومات اور علاج کی رہنمائی |
| Short description | Offline bilingual guidance and transparent care navigation for families across Pakistan. | پاکستان بھر کے خاندانوں کے لیے آف لائن دو لسانی رہنمائی اور واضح علاج کی تلاش۔ |
| Category | Medical | طبی |
| Support contact | `info@psova.org.pk` — owner confirmation required | `info@psova.org.pk` — مالک کی تصدیق درکار |
| Phone | `+92 321 4261 950` | `+92 321 4261 950` |

### English full description

PSOVA provides plain-language English and Urdu information about common vascular tumours and malformations, an offline condition library, a transparent directory of representative care centres in Pakistan, news, glossary terms, and safe ways to contact the Pakistan Society Of Vascular Anomaly. Core content works without a connection, favorites remain on the device, and directory records show their verification status.

PSOVA provides general educational information only. It does not diagnose a condition, replace a qualified clinician, dispatch emergency care, collect payments, or create a patient registry. Confirm directory details with the institution before travelling.

### Urdu full description

پی ایس او وی اے عام ویسکولر ٹیومرز اور میل فارمیشنز کے بارے میں سادہ اردو اور انگریزی معلومات، آف لائن بیماری لائبریری، پاکستان کے نمائندہ علاج مراکز کی واضح ڈائرکٹری، خبریں، اصطلاحات اور محفوظ رابطے کے طریقے فراہم کرتی ہے۔ بنیادی مواد انٹرنیٹ کے بغیر بھی دستیاب ہے، محفوظ مراکز ڈیوائس پر رہتے ہیں، اور ہر ڈائرکٹری اندراج اپنی تصدیق کی حیثیت دکھاتا ہے۔

یہ ایپ صرف عمومی تعلیمی معلومات فراہم کرتی ہے۔ یہ تشخیص، مستند معالج، ہنگامی نگہداشت، ادائیگی یا مریض رجسٹری کا متبادل نہیں۔ سفر سے پہلے ادارے سے تفصیلات کی تصدیق کریں۔

## Keywords

English: vascular anomaly, birthmark, hemangioma, malformation, Pakistan, child health, specialist, PSOVA. Urdu: پیدائشی نشان، ہیمانجیوما، ویسکولر، علاج، پاکستان، بچوں کی صحت، ماہر۔ Do not use competitor names or imply treatment outcomes.

## Privacy and data-safety answers

| Data/activity | Collection and purpose | Sharing/retention |
|---|---|---|
| Condition/news/directory browsing | Not collected by the core app. | None. |
| Locale, theme, favorites | Stored locally for app functionality. | Not shared; deleted by local-data reset or uninstall. |
| Contact/ask-expert/pledge form | User provides name and at least one contact method plus optional free text. | Sent to PSOVA's configured email provider after explicit submission; durable status retained for idempotency. |
| Push token | Collected only after contextual consent with platform, locale, app version, and consent time. | Encrypted in backend storage; sent to FCM/APNs for notification delivery; invalid tokens removed. |
| Child record/photos | Feature disabled. | No collection or sync. |
| Payments | Not supported. | No financial data collected. |

Final Play Data Safety and Apple App Privacy forms must match the deployed provider contracts and retention policy. The privacy-policy URL must be a stable HTTPS PSOVA-controlled page before submission.

## Reviewer notes

The app is a non-profit informational resource. No login is required. Use the Library and Directory offline. Directory entries are intentionally marked not institution-verified; placeholder phone numbers are removed. Notification consent appears inside News. Contact delivery requires the production backend configuration. The child record row is visibly locked and creates no health record. `psova://condition/infantile-hemangioma`, `psova://directory`, and approved `psova://news/<id>` demonstrate custom deep links.

## Screenshot inventory

Six engineering screenshots are in `docs/release/screenshots`: Home, Library, and Directory in English and Urdu at 430×932. The CDP capture script validates a true mobile viewport and rejects horizontal overflow. Produce store-specific 6.7-inch iPhone and required Play dimensions from signed release builds if the store rejects this engineering size.

## Content rating

The app contains general medical education but no graphic procedures, user-generated content, gambling, payments, or social interaction. Answer store questionnaires truthfully; do not classify it as providing regulated diagnosis or emergency services.
