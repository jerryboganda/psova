import type { LocalizedString } from './conditions';

// Org-level constants. Items marked PLACEHOLDER must be supplied by PSOVA.
export const SITE = {
  shortName: 'PSOVA',
  fullName: {
    en: 'Pakistan Society Of Vascular Anomaly',
    ur: 'پاکستان سوسائٹی آف ویسکولر ایناملی',
  } as LocalizedString,
  tagline: {
    en: 'Common. Treatable. You are not alone.',
    ur: 'عام۔ قابلِ علاج۔ آپ اکیلے نہیں۔',
  } as LocalizedString,
  // PLACEHOLDER contact details (email/address still to be confirmed).
  email: 'info@psova.org.pk',
  // CONFIRMED — used as the "Contact us" and donations number across the whole site.
  phone: '+92 321 4261 950',
  // CONFIRMED — primary contact & donations lead. Urdu role needs native review.
  contactPerson: {
    name: 'Dr Faisal Maqsood Anwar',
    role: {
      en: 'Donations & Contact Lead',
      ur: 'عطیات و رابطہ سربراہ',
    } as LocalizedString,
  },
  address: {
    en: 'Pakistan',
    ur: 'پاکستان',
  } as LocalizedString,
  social: {
    facebook: '#',
    instagram: '#',
    youtube: '#',
    linkedin: '#',
    x: '#',
  },
};

export type Stat = { value: string; label: LocalizedString };

// Awareness statistics (rounded, from public literature — see condition sources).
export const STATS: Stat[] = [
  {
    value: '1 in 20',
    label: { en: 'infants develop a hemangioma', ur: 'بچوں میں سے ایک کو ہیمانجیوما' },
  },
  {
    value: '90%+',
    label: { en: 'of cases are benign', ur: 'کیسز بے ضرر ہوتے ہیں' },
  },
  {
    value: '0',
    label: { en: 'national societies — until now', ur: 'قومی سوسائٹیز — اب تک' },
  },
  {
    value: '4',
    label: { en: 'provinces we aim to reach', ur: 'صوبے جہاں ہم پہنچنا چاہتے ہیں' },
  },
];

export type Partner = { name: string; note: LocalizedString };

// Reference partners / aligned bodies (logos to be added; names are public).
export const PARTNERS: Partner[] = [
  { name: 'ISSVA', note: { en: 'Global classification standard', ur: 'عالمی درجہ بندی معیار' } },
  { name: 'CPSP', note: { en: 'College of Physicians & Surgeons Pakistan', ur: 'کالج آف فزیشنز اینڈ سرجنز پاکستان' } },
  { name: 'PAD', note: { en: 'Pakistan Association of Dermatologists', ur: 'پاکستان ایسوسی ایشن آف ڈرمیٹولوجسٹس' } },
  { name: 'Indus Hospital', note: { en: 'Vascular Anomalies Clinic, Karachi', ur: 'ویسکولر ایناملیز کلینک، کراچی' } },
  { name: 'AKUH', note: { en: 'Aga Khan University Hospital', ur: 'آغا خان یونیورسٹی ہسپتال' } },
];

export type Value = { icon: string; title: LocalizedString; body: LocalizedString };

export const VALUES: Value[] = [
  {
    icon: 'heart-handshake',
    title: { en: 'Compassion first', ur: 'پہلے ہمدردی' },
    body: {
      en: 'We meet families with warmth and reassurance — science comes one click deeper.',
      ur: 'ہم خاندانوں کو گرمجوشی اور تسلی سے ملتے ہیں — سائنس ایک قدم آگے۔',
    },
  },
  {
    icon: 'map-pin',
    title: { en: 'Care you can reach', ur: 'قابلِ رسائی علاج' },
    body: {
      en: 'A verified, Pakistan-wide directory so no family has to search blindly.',
      ur: 'ایک تصدیق شدہ، ملک گیر ڈائرکٹری تاکہ کسی خاندان کو اندھیرے میں تلاش نہ کرنا پڑے۔',
    },
  },
  {
    icon: 'microscope',
    title: { en: 'Grounded in evidence', ur: 'شواہد پر مبنی' },
    body: {
      en: 'Aligned with the ISSVA classification and reviewed by clinicians.',
      ur: 'ISSVA درجہ بندی کے مطابق اور معالجین سے نظرثانی شدہ۔',
    },
  },
  {
    icon: 'users',
    title: { en: 'A community, not a clinic', ur: 'ایک برادری، کلینک نہیں' },
    body: {
      en: 'Connecting families and specialists across every province.',
      ur: 'ہر صوبے میں خاندانوں اور ماہرین کو جوڑنا۔',
    },
  },
];
