import type { Locale } from '@psova/domain';

const en = {
  tabs: { home: 'Home', library: 'Library', directory: 'Directory', news: 'News', more: 'More' },
  common: {
    back: 'Back', search: 'Search', clear: 'Clear', all: 'All', save: 'Save', saved: 'Saved', share: 'Share',
    call: 'Call', directions: 'Directions', website: 'Website', retry: 'Retry', close: 'Close', continue: 'Continue',
    offline: 'Offline — showing saved information', stale: 'Saved information may be out of date.', loading: 'Loading…',
    noResults: 'No matching information found.', unverified: 'Not yet institution-verified', draft: 'Representative draft',
    learnMore: 'Learn more', contact: 'Contact PSOVA', language: 'Language', english: 'English', urdu: 'اردو',
  },
  home: {
    eyebrow: 'Pakistan Society Of Vascular Anomaly', title: 'Every birthmark has a story — and a path to care.',
    body: 'Plain-language guidance, a care directory, and a community for families across Pakistan.',
    library: 'Understand the conditions', directory: 'Find care in Pakistan', parent: "I'm a parent or carer",
    professional: "I'm a healthcare professional", featured: 'Featured condition', reassurance: 'Common. Treatable. You are not alone.',
    safety: 'This app provides general information and does not replace a medical consultation.',
  },
  library: {
    title: 'Condition library', body: 'Bilingual guidance available even when you are offline.',
    placeholder: 'Search a condition or symptom…', tumors: 'Vascular tumours', malformations: 'Malformations',
    anatomy: 'Open anatomy explorer', signs: 'Signs to look for', onset: 'Typical onset', prevalence: 'How common',
    diagnosis: "How it's diagnosed", treatment: 'Treatment options', when: 'When to see a specialist',
    disclaimer: 'General medical information only. Seek qualified care for diagnosis and treatment.',
  },
  directory: {
    title: 'Find specialist care', body: 'Representative records are shown transparently while PSOVA completes institutional verification.',
    placeholder: 'Search hospital, city, or service…', province: 'Province', type: 'Type', services: 'Services',
    verify: 'Confirm details with the institution before travelling. Placeholder phone numbers are never shown in this app.',
    favorite: 'Save centre', unfavorite: 'Remove saved centre', public: 'Public', private: 'Private', trust: 'Trust / charity',
  },
  news: {
    title: 'News and events', body: 'Announcements, awareness activities, and family stories.',
    notifications: 'Get PSOVA news alerts', enable: 'Enable notifications', enabled: 'Notifications enabled',
    permissionDenied: 'Notification permission was not granted. You can change it in device settings.',
  },
  more: {
    title: 'More', settings: 'Settings', contact: 'Ask PSOVA', donate: 'Donate / get involved', about: 'About PSOVA',
    patients: 'For patients and families', professionals: 'For professionals', research: 'Research', glossary: 'Glossary',
    privacy: 'Privacy', terms: 'Terms and medical disclaimer', journal: "My child's record", journalLocked: 'Unavailable pending privacy and clinical approval',
  },
  settings: {
    title: 'Settings', appearance: 'Appearance', system: 'Use device setting', light: 'Light', dark: 'Dark',
    notifications: 'Notifications', storage: 'Offline storage', revision: 'Content revision', published: 'Snapshot date',
    review: 'Content review status', refresh: 'Refresh saved information', deleteLocal: 'Delete local app data',
    deleteConfirm: 'Delete preferences, favorites, drafts, and cached updates from this device?', deleted: 'Local app data deleted.',
  },
  contact: {
    title: 'Contact or ask an expert', body: 'Messages are saved on this device if you are offline and sent when a connection returns.',
    kind: 'Reason', general: 'General contact', expert: 'Ask an expert', pledge: 'Donation pledge', name: 'Your name',
    email: 'Email', phone: 'Phone', subject: 'Subject', message: 'Message', childAge: "Child's age (optional)",
    send: 'Send message', queue: 'Save to outbox', pending: 'Saved — waiting to send', sent: 'Accepted for delivery',
    failed: 'Could not send yet. It remains in your outbox.', required: 'Please complete the required fields.',
    privacy: 'Do not include emergency information. For urgent medical help, contact local emergency services or a qualified clinician.',
  },
  anatomy: { title: 'Anatomy explorer', body: 'Tap a point to open a related condition. This is an educational illustration, not a diagnostic tool.' },
};

const ur: typeof en = {
  tabs: { home: 'ہوم', library: 'لائبریری', directory: 'ڈائرکٹری', news: 'خبریں', more: 'مزید' },
  common: {
    back: 'واپس', search: 'تلاش', clear: 'صاف کریں', all: 'سب', save: 'محفوظ کریں', saved: 'محفوظ', share: 'شیئر',
    call: 'کال', directions: 'راستہ', website: 'ویب سائٹ', retry: 'دوبارہ کوشش', close: 'بند', continue: 'جاری رکھیں',
    offline: 'آف لائن — محفوظ معلومات دکھائی جا رہی ہیں', stale: 'محفوظ معلومات پرانی ہو سکتی ہیں۔', loading: 'لوڈ ہو رہا ہے…',
    noResults: 'مماثل معلومات نہیں ملیں۔', unverified: 'ادارے سے ابھی تصدیق نہیں ہوئی', draft: 'نمائندہ مسودہ',
    learnMore: 'مزید جانیں', contact: 'پی ایس او وی اے سے رابطہ', language: 'زبان', english: 'English', urdu: 'اردو',
  },
  home: {
    eyebrow: 'پاکستان سوسائٹی آف ویسکولر ایناملی', title: 'ہر پیدائشی نشان کی ایک کہانی ہے — اور علاج کا ایک راستہ۔',
    body: 'سادہ زبان میں رہنمائی، علاج کی ڈائرکٹری، اور پاکستان بھر کے خاندانوں کے لیے برادری۔',
    library: 'بیماریوں کو سمجھیں', directory: 'پاکستان میں علاج تلاش کریں', parent: 'میں والدین یا نگہداشت کنندہ ہوں',
    professional: 'میں ماہرِ صحت ہوں', featured: 'نمایاں بیماری', reassurance: 'عام۔ قابلِ علاج۔ آپ اکیلے نہیں۔',
    safety: 'یہ ایپ عمومی معلومات فراہم کرتی ہے اور طبی مشورے کا متبادل نہیں۔',
  },
  library: {
    title: 'بیماریوں کی لائبریری', body: 'دو لسانی رہنمائی جو آف لائن بھی دستیاب ہے۔',
    placeholder: 'بیماری یا علامت تلاش کریں…', tumors: 'ویسکولر ٹیومرز', malformations: 'میل فارمیشنز',
    anatomy: 'ایناٹمی ایکسپلورر کھولیں', signs: 'دیکھنے کی علامات', onset: 'عام آغاز', prevalence: 'کتنا عام',
    diagnosis: 'تشخیص کیسے ہوتی ہے', treatment: 'علاج کے اختیارات', when: 'ماہر سے کب رجوع کریں',
    disclaimer: 'صرف عمومی طبی معلومات۔ تشخیص اور علاج کے لیے مستند طبی نگہداشت حاصل کریں۔',
  },
  directory: {
    title: 'ماہرانہ علاج تلاش کریں', body: 'اداروں سے تصدیق مکمل ہونے تک نمائندہ اندراجات واضح طور پر دکھائے جاتے ہیں۔',
    placeholder: 'ہسپتال، شہر یا سروس تلاش کریں…', province: 'صوبہ', type: 'قسم', services: 'سروسز',
    verify: 'سفر سے پہلے ادارے سے تفصیلات کی تصدیق کریں۔ عارضی فون نمبر ایپ میں کبھی نہیں دکھائے جاتے۔',
    favorite: 'مرکز محفوظ کریں', unfavorite: 'محفوظ مرکز ہٹائیں', public: 'سرکاری', private: 'نجی', trust: 'ٹرسٹ / خیراتی',
  },
  news: {
    title: 'خبریں و تقریبات', body: 'اعلانات، آگاہی سرگرمیاں اور خاندانی کہانیاں۔',
    notifications: 'پی ایس او وی اے خبروں کے الرٹس حاصل کریں', enable: 'نوٹیفکیشن فعال کریں', enabled: 'نوٹیفکیشن فعال ہیں',
    permissionDenied: 'نوٹیفکیشن کی اجازت نہیں ملی۔ اسے ڈیوائس سیٹنگز میں بدلا جا سکتا ہے۔',
  },
  more: {
    title: 'مزید', settings: 'سیٹنگز', contact: 'پی ایس او وی اے سے پوچھیں', donate: 'عطیہ / ساتھ دیں', about: 'پی ایس او وی اے کا تعارف',
    patients: 'مریضوں اور خاندانوں کے لیے', professionals: 'ماہرین کے لیے', research: 'تحقیق', glossary: 'اصطلاحات',
    privacy: 'رازداری', terms: 'شرائط اور طبی وضاحت', journal: 'میرے بچے کا ریکارڈ', journalLocked: 'رازداری و طبی منظوری تک دستیاب نہیں',
  },
  settings: {
    title: 'سیٹنگز', appearance: 'ظاہری شکل', system: 'ڈیوائس سیٹنگ استعمال کریں', light: 'روشن', dark: 'گہرا',
    notifications: 'نوٹیفکیشن', storage: 'آف لائن اسٹوریج', revision: 'مواد کا ورژن', published: 'اسنیپ شاٹ تاریخ',
    review: 'مواد کی نظرثانی', refresh: 'محفوظ معلومات تازہ کریں', deleteLocal: 'مقامی ایپ ڈیٹا حذف کریں',
    deleteConfirm: 'اس ڈیوائس سے ترجیحات، محفوظ مراکز، مسودے اور کیش حذف کریں؟', deleted: 'مقامی ایپ ڈیٹا حذف ہو گیا۔',
  },
  contact: {
    title: 'رابطہ یا ماہر سے سوال', body: 'آف لائن ہونے پر پیغام ڈیوائس پر محفوظ رہتا ہے اور کنکشن آنے پر بھیجا جاتا ہے۔',
    kind: 'وجہ', general: 'عمومی رابطہ', expert: 'ماہر سے سوال', pledge: 'عطیے کا وعدہ', name: 'آپ کا نام',
    email: 'ای میل', phone: 'فون', subject: 'موضوع', message: 'پیغام', childAge: 'بچے کی عمر (اختیاری)',
    send: 'پیغام بھیجیں', queue: 'آؤٹ باکس میں محفوظ کریں', pending: 'محفوظ — بھیجنے کا انتظار', sent: 'ترسیل کے لیے قبول',
    failed: 'ابھی نہیں بھیجا جا سکا۔ آؤٹ باکس میں محفوظ ہے۔', required: 'ضروری خانے مکمل کریں۔',
    privacy: 'ہنگامی معلومات شامل نہ کریں۔ فوری طبی مدد کے لیے مقامی ایمرجنسی خدمات یا مستند معالج سے رابطہ کریں۔',
  },
  anatomy: { title: 'ایناٹمی ایکسپلورر', body: 'متعلقہ بیماری کھولنے کے لیے نقطے پر ٹیپ کریں۔ یہ تعلیمی خاکہ ہے، تشخیصی آلہ نہیں۔' },
};

export type Messages = typeof en;
export const mobileMessages: Record<Locale, Messages> = { en, ur };
export function direction(locale: Locale): 'ltr' | 'rtl' { return locale === 'ur' ? 'rtl' : 'ltr'; }
