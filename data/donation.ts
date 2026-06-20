import type { LocalizedString } from './conditions';
import { SITE } from './site';

// Donation content model. Every text field is { en, ur } and rendered via localized().
// Financial values marked `placeholder: true` are PLACEHOLDERS that PSOVA must replace
// before launch — only the account TITLE and the contact phone are real/confirmed.

export type GivingTier = {
  amount: number;
  display: string;
  impact: LocalizedString;
  accent: string;
};

export type Designation = {
  id: 'zakat' | 'sadaqah' | 'sponsor-child' | 'recurring';
  icon: string;
  title: LocalizedString;
  body: LocalizedString;
  note?: LocalizedString;
  accent: string;
};

export type PaymentField = {
  label: LocalizedString;
  value: string;
  copyable?: boolean;
  /** True when the value is a placeholder PSOVA must replace before launch. */
  placeholder?: boolean;
};

export type PaymentMethod = {
  id: 'bank' | 'jazzcash' | 'easypaisa' | 'raast' | 'international' | 'card';
  name: LocalizedString;
  icon: string;
  blurb?: LocalizedString;
  fields: PaymentField[];
  comingSoon?: boolean;
  accent: string;
};

// Suggested amounts in PKR, with real-world impact framing.
export const GIVING_TIERS: GivingTier[] = [
  {
    amount: 1500,
    display: 'Rs 1,500',
    accent: '#1fe0d4',
    impact: {
      en: 'Prints plain-language guides for 10 worried families.',
      ur: 'دس پریشان خاندانوں کے لیے سادہ زبان کے رہنما کتابچے۔',
    },
  },
  {
    amount: 5000,
    display: 'Rs 5,000',
    accent: '#3d6cff',
    impact: {
      en: 'Helps a rural family travel to a specialist consultation.',
      ur: 'ایک دیہی خاندان کو ماہر سے مشاورت تک پہنچنے میں مدد۔',
    },
  },
  {
    amount: 15000,
    display: 'Rs 15,000',
    accent: '#8b3dff',
    impact: {
      en: 'Supports diagnostic tests for a child with a vascular anomaly.',
      ur: 'ویسکولر ایناملی والے بچے کے تشخیصی ٹیسٹوں میں معاونت۔',
    },
  },
  {
    amount: 50000,
    display: 'Rs 50,000',
    accent: '#ff2d9b',
    impact: {
      en: "Sponsors a meaningful part of a child's treatment.",
      ur: 'کسی بچے کے علاج کے ایک اہم حصے کی کفالت۔',
    },
  },
];

export const DESIGNATIONS: Designation[] = [
  {
    id: 'zakat',
    icon: 'hand-coins',
    accent: '#8b3dff',
    title: { en: 'Zakat', ur: 'زکوٰۃ' },
    body: {
      en: 'Give your obligatory Zakat to support eligible patients with treatment costs.',
      ur: 'اپنی فرض زکوٰۃ مستحق مریضوں کے علاج کے اخراجات میں معاونت کے لیے دیں۔',
    },
    note: {
      en: 'Your Zakat is distributed only to eligible (mustahiqeen) patients, in line with Shariah.',
      ur: 'آپ کی زکوٰۃ شریعت کے مطابق صرف مستحق مریضوں میں تقسیم کی جاتی ہے۔',
    },
  },
  {
    id: 'sadaqah',
    icon: 'heart',
    accent: '#ff2d9b',
    title: { en: 'Sadaqah / General', ur: 'صدقہ / عمومی' },
    body: {
      en: 'A general donation that funds awareness, the care directory, and family support.',
      ur: 'ایک عمومی عطیہ جو آگاہی، ڈائرکٹری اور خاندانی معاونت کو فنڈ کرتا ہے۔',
    },
  },
  {
    id: 'sponsor-child',
    icon: 'baby',
    accent: '#1fe0d4',
    title: { en: 'Sponsor a child', ur: 'ایک بچے کی کفالت' },
    body: {
      en: 'Earmark your gift toward the treatment of a child who needs specialist care.',
      ur: 'اپنا عطیہ کسی ایسے بچے کے علاج کے لیے مخصوص کریں جسے ماہر علاج درکار ہے۔',
    },
  },
  {
    id: 'recurring',
    icon: 'repeat',
    accent: '#3d6cff',
    title: { en: 'Monthly giving', ur: 'ماہانہ عطیہ' },
    body: {
      en: 'Become a sustaining supporter with a gift that repeats every month.',
      ur: 'ہر ماہ دہرائے جانے والے عطیے کے ساتھ مستقل معاون بنیں۔',
    },
    note: {
      en: 'Cancel anytime — we confirm every month.',
      ur: 'کسی بھی وقت منسوخ کریں — ہم ہر ماہ تصدیق کرتے ہیں۔',
    },
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bank',
    icon: 'landmark',
    accent: '#3d6cff',
    name: { en: 'Bank transfer', ur: 'بینک ٹرانسفر' },
    blurb: {
      en: 'Direct transfer or deposit to our account.',
      ur: 'ہمارے اکاؤنٹ میں براہِ راست منتقلی یا جمع۔',
    },
    fields: [
      {
        label: { en: 'Account title', ur: 'اکاؤنٹ ٹائٹل' },
        value: 'Pakistan Society Of Vascular Anomaly',
        copyable: true,
      },
      { label: { en: 'Bank', ur: 'بینک' }, value: 'PLACEHOLDER — bank name', placeholder: true },
      {
        label: { en: 'Account number', ur: 'اکاؤنٹ نمبر' },
        value: 'PLACEHOLDER — account no.',
        copyable: true,
        placeholder: true,
      },
      {
        label: { en: 'IBAN', ur: 'آئی بان' },
        value: 'PK00 XXXX 0000 0000 0000 0000',
        copyable: true,
        placeholder: true,
      },
    ],
  },
  {
    id: 'jazzcash',
    icon: 'smartphone',
    accent: '#ff2d9b',
    name: { en: 'JazzCash', ur: 'جاز کیش' },
    blurb: {
      en: 'Send from your JazzCash mobile wallet.',
      ur: 'اپنے جاز کیش موبائل والٹ سے بھیجیں۔',
    },
    fields: [
      {
        label: { en: 'Account name', ur: 'اکاؤنٹ نام' },
        value: 'PLACEHOLDER — account name',
        placeholder: true,
      },
      {
        label: { en: 'JazzCash number', ur: 'جاز کیش نمبر' },
        value: 'PLACEHOLDER — 03XX XXXXXXX',
        copyable: true,
        placeholder: true,
      },
    ],
  },
  {
    id: 'easypaisa',
    icon: 'wallet',
    accent: '#1fe0d4',
    name: { en: 'Easypaisa', ur: 'ایزی پیسہ' },
    blurb: {
      en: 'Send from your Easypaisa mobile wallet.',
      ur: 'اپنے ایزی پیسہ موبائل والٹ سے بھیجیں۔',
    },
    fields: [
      {
        label: { en: 'Account name', ur: 'اکاؤنٹ نام' },
        value: 'PLACEHOLDER — account name',
        placeholder: true,
      },
      {
        label: { en: 'Easypaisa number', ur: 'ایزی پیسہ نمبر' },
        value: 'PLACEHOLDER — 03XX XXXXXXX',
        copyable: true,
        placeholder: true,
      },
    ],
  },
  {
    id: 'raast',
    icon: 'zap',
    accent: '#8b3dff',
    name: { en: 'Raast', ur: 'راست' },
    blurb: {
      en: 'Instant, free bank-to-bank transfer using a Raast ID in your banking app.',
      ur: 'اپنی بینکنگ ایپ میں راست آئی ڈی سے فوری، مفت بینک ٹو بینک منتقلی۔',
    },
    fields: [
      // CONFIRM: Raast ID is plausibly the contact phone — verify before launch.
      {
        label: { en: 'Raast ID', ur: 'راست آئی ڈی' },
        value: SITE.phone,
        copyable: true,
        placeholder: true,
      },
    ],
  },
  {
    id: 'international',
    icon: 'globe',
    accent: '#3d6cff',
    name: { en: 'International / overseas', ur: 'بین الاقوامی / بیرونِ ملک' },
    blurb: {
      en: 'For supporters donating from outside Pakistan.',
      ur: 'پاکستان سے باہر سے عطیہ دینے والوں کے لیے۔',
    },
    fields: [
      {
        label: { en: 'Account title', ur: 'اکاؤنٹ ٹائٹل' },
        value: 'Pakistan Society Of Vascular Anomaly',
        copyable: true,
      },
      {
        label: { en: 'SWIFT / BIC', ur: 'سوئفٹ / بی آئی سی' },
        value: 'PLACEHOLDER — SWIFT',
        copyable: true,
        placeholder: true,
      },
      { label: { en: 'IBAN', ur: 'آئی بان' }, value: 'PLACEHOLDER — IBAN', copyable: true, placeholder: true },
      { label: { en: 'PayPal', ur: 'پے پال' }, value: 'PLACEHOLDER — PayPal', placeholder: true },
      { label: { en: 'Wise', ur: 'وائز' }, value: 'PLACEHOLDER — Wise', placeholder: true },
    ],
  },
  {
    id: 'card',
    icon: 'credit-card',
    accent: '#ff2d9b',
    name: { en: 'Card / online', ur: 'کارڈ / آن لائن' },
    comingSoon: true,
    fields: [],
  },
];
