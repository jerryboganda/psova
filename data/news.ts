import type { LocalizedString } from './conditions';

export type EventPerson = {
  name: LocalizedString;
  role: LocalizedString;
};

export type EventDetails = {
  start: string; // ISO datetime with offset
  end: string;
  venue: LocalizedString;
  poster: string; // path under /public
  focus: LocalizedString[];
  speaker: EventPerson;
  patron: EventPerson;
  audience: LocalizedString;
  contact: { name: LocalizedString; phone: string }; // phone in E.164
  free: boolean;
};

export type NewsItem = {
  id: string;
  kind: 'news' | 'event' | 'story';
  date: string; // ISO
  title: LocalizedString;
  excerpt: LocalizedString;
  tag: LocalizedString;
  body?: LocalizedString;
  event?: EventDetails;
};

const CHICH: LocalizedString = {
  en: "The Children's Hospital & Institute of Child Health, Multan",
  ur: 'دی چلڈرن ہسپتال اینڈ انسٹی ٹیوٹ آف چائلڈ ہیلتھ، ملتان',
};

// Newest first.
export const NEWS: NewsItem[] = [
  {
    id: 'vascular-anomalies-dilemma-workshop-2026',
    kind: 'event',
    date: '2026-10-28',
    title: {
      en: 'Vascular Anomalies Dilemma Workshop — Approach for Diagnosis and Management',
      ur: 'ویسکولر ایناملیز ڈائلیما ورکشاپ — تشخیص اور علاج کا طریقۂ کار',
    },
    excerpt: {
      en: "A free half-day workshop in Multan on recognising, diagnosing, and managing vascular anomalies, led by Prof. Dr. Iqbal Hussain Dogar.",
      ur: 'ملتان میں ویسکولر ایناملیز کی شناخت، تشخیص اور علاج پر ایک مفت نصف روزہ ورکشاپ، جس کی قیادت پروفیسر ڈاکٹر اقبال حسین ڈوگر کریں گے۔',
    },
    tag: { en: 'Workshop', ur: 'ورکشاپ' },
    body: {
      en: "Vascular anomalies are often misdiagnosed and mismanaged. This workshop gives clinicians a practical, imaging-led approach to telling hemangiomas and vascular malformations apart, choosing the right investigations, and knowing when to refer for multidisciplinary care. Wednesday 28 October 2026, 11:00 AM – 2:00 PM, Auditorium, The Children's Hospital & Institute of Child Health, Multan. Registration is free — contact Dr. Obaidullah, +92 331 8702344.",
      ur: 'ویسکولر ایناملیز کی اکثر غلط تشخیص اور غلط علاج ہوتا ہے۔ یہ ورکشاپ معالجین کو ہیمانجیوما اور ویسکولر مالفارمیشن میں فرق کرنے، درست ٹیسٹ منتخب کرنے اور کثیر الشعبہ علاج کے لیے بروقت ریفر کرنے کا عملی، امیجنگ پر مبنی طریقہ سکھائے گی۔ بدھ 28 اکتوبر 2026، صبح 11 بجے تا دوپہر 2 بجے، آڈیٹوریم، دی چلڈرن ہسپتال اینڈ انسٹی ٹیوٹ آف چائلڈ ہیلتھ، ملتان۔ رجسٹریشن مفت ہے — ڈاکٹر عبید اللہ سے رابطہ کریں: 8702344 331 92+۔',
    },
    event: {
      start: '2026-10-28T11:00:00+05:00',
      end: '2026-10-28T14:00:00+05:00',
      venue: { en: `Auditorium, ${CHICH.en}`, ur: `آڈیٹوریم، ${CHICH.ur}` },
      poster: '/events/vascular-anomalies-dilemma-workshop-2026.webp',
      focus: [
        { en: 'Recognize', ur: 'شناخت' },
        { en: 'Diagnose', ur: 'تشخیص' },
        { en: 'Manage', ur: 'علاج' },
        { en: 'Multidisciplinary care', ur: 'کثیر الشعبہ نگہداشت' },
      ],
      speaker: {
        name: { en: 'Prof. Dr. Iqbal Hussain Dogar', ur: 'پروفیسر ڈاکٹر اقبال حسین ڈوگر' },
        role: {
          en: `Head of Department & Professor of Pediatric Radiology, ${CHICH.en}`,
          ur: `سربراہ شعبہ و پروفیسر پیڈیاٹرک ریڈیالوجی، ${CHICH.ur}`,
        },
      },
      patron: {
        name: { en: 'Prof. Dr. Muhammad Kashif Chishti', ur: 'پروفیسر ڈاکٹر محمد کاشف چشتی' },
        role: { en: `Dean, ${CHICH.en}`, ur: `ڈین، ${CHICH.ur}` },
      },
      audience: {
        en: 'Pediatricians, radiologists, surgeons, residents, medical students, and all interested healthcare professionals.',
        ur: 'ماہرینِ اطفال، ریڈیالوجسٹ، سرجن، ریزیڈنٹس، میڈیکل طلبہ اور تمام دلچسپی رکھنے والے طبی ماہرین۔',
      },
      contact: { name: { en: 'Dr. Obaidullah', ur: 'ڈاکٹر عبید اللہ' }, phone: '+923318702344' },
      free: true,
    },
  },
];
