import type { LocalizedString } from './conditions';

export type NewsItem = {
  id: string;
  kind: 'news' | 'event' | 'story';
  date: string; // ISO
  title: LocalizedString;
  excerpt: LocalizedString;
  tag: LocalizedString;
};

// Representative placeholder content — replace with real PSOVA updates.
export const NEWS: NewsItem[] = [
  {
    id: 'launch',
    kind: 'news',
    date: '2026-06-01',
    title: {
      en: 'PSOVA launches Pakistan’s first vascular anomaly society',
      ur: 'پی ایس او وی اے نے پاکستان کی پہلی ویسکولر ایناملی سوسائٹی کا آغاز کر دیا',
    },
    excerpt: {
      en: 'A national network connecting families, specialists, and centres to make expert vascular anomaly care reachable across Pakistan.',
      ur: 'ایک قومی نیٹ ورک جو خاندانوں، ماہرین اور مراکز کو جوڑتا ہے تاکہ ماہرانہ ویسکولر ایناملی علاج پاکستان بھر میں قابلِ رسائی ہو۔',
    },
    tag: { en: 'Announcement', ur: 'اعلان' },
  },
  {
    id: 'awareness-week',
    kind: 'event',
    date: '2026-09-15',
    title: {
      en: 'National Vascular Birthmark Awareness Week',
      ur: 'قومی ویسکولر برتھ مارک آگاہی ہفتہ',
    },
    excerpt: {
      en: 'Free awareness sessions in Karachi, Lahore, and Islamabad — “birthmarks are common, treatable, and not anyone’s fault.”',
      ur: 'کراچی، لاہور اور اسلام آباد میں مفت آگاہی نشستیں — "پیدائشی نشان عام، قابلِ علاج اور کسی کی غلطی نہیں۔"',
    },
    tag: { en: 'Event', ur: 'تقریب' },
  },
  {
    id: 'story-ayaan',
    kind: 'story',
    date: '2026-05-10',
    title: {
      en: '“We finally found the right team” — Ayaan’s story',
      ur: '"بالآخر ہمیں صحیح ٹیم مل گئی" — ایان کی کہانی',
    },
    excerpt: {
      en: 'A family’s journey from a worrying birthmark to early, coordinated treatment — and the relief of a clear diagnosis.',
      ur: 'ایک پریشان کن پیدائشی نشان سے جلد، مربوط علاج تک ایک خاندان کا سفر — اور واضح تشخیص کا سکون۔',
    },
    tag: { en: 'Patient Story', ur: 'مریض کی کہانی' },
  },
  {
    id: 'webinar',
    kind: 'event',
    date: '2026-07-20',
    title: {
      en: 'Webinar: Propranolol for infantile hemangioma',
      ur: 'ویبینار: بچپن کے ہیمانجیوما کے لیے پروپرانولول',
    },
    excerpt: {
      en: 'A session for parents and primary-care doctors on when treatment helps and what to expect.',
      ur: 'والدین اور بنیادی نگہداشت کے ڈاکٹروں کے لیے ایک نشست کہ علاج کب مددگار ہے اور کیا توقع رکھیں۔',
    },
    tag: { en: 'Webinar', ur: 'ویبینار' },
  },
  {
    id: 'registry',
    kind: 'news',
    date: '2026-06-12',
    title: {
      en: 'Building a national vascular anomaly registry',
      ur: 'قومی ویسکولر ایناملی رجسٹری کی تعمیر',
    },
    excerpt: {
      en: 'PSOVA is planning a patient registry to map need, guide research, and improve care pathways nationwide.',
      ur: 'پی ایس او وی اے ضرورت کا نقشہ بنانے، تحقیق کی رہنمائی اور ملک گیر علاج کے راستے بہتر کرنے کے لیے مریض رجسٹری کی منصوبہ بندی کر رہا ہے۔',
    },
    tag: { en: 'Research', ur: 'تحقیق' },
  },
  {
    id: 'story-hira',
    kind: 'story',
    date: '2026-04-02',
    title: {
      en: '“She is not alone anymore” — Hira’s mother',
      ur: '"وہ اب اکیلی نہیں" — حرا کی والدہ',
    },
    excerpt: {
      en: 'Connecting with other families changed everything — from isolation to a community that understands.',
      ur: 'دوسرے خاندانوں سے رابطے نے سب کچھ بدل دیا — تنہائی سے ایک سمجھنے والی برادری تک۔',
    },
    tag: { en: 'Patient Story', ur: 'مریض کی کہانی' },
  },
];
