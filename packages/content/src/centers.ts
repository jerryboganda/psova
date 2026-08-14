import type { LocalizedString } from './conditions';

export type CareCenter = {
  id: string;
  name: LocalizedString;
  city: LocalizedString;
  province: LocalizedString;
  type: 'public' | 'private' | 'trust';
  services: LocalizedString[];
  conditions: string[]; // condition slugs commonly managed
  phone: string;
  website?: string;
  // Geographic position used by the Pakistan particle map.
  geo: { lat: number; lng: number };
  // Normalised position (0..1) within the stylised Pakistan map viewport.
  pos: { x: number; y: number };
  flagship?: boolean;
};

// NOTE: Representative directory compiled from public research.
// Every entry must be verified with the institution before public launch.
export const CARE_CENTERS: CareCenter[] = [
  {
    id: 'indus-vac-karachi',
    name: { en: 'Indus Hospital — Vascular Anomalies Clinic', ur: 'انڈس ہسپتال — ویسکولر ایناملیز کلینک' },
    city: { en: 'Karachi', ur: 'کراچی' },
    province: { en: 'Sindh', ur: 'سندھ' },
    type: 'trust',
    services: [
      { en: 'Multidisciplinary clinic', ur: 'کثیر‑ماہر کلینک' },
      { en: 'Propranolol & timolol', ur: 'پروپرانولول و ٹیمولول' },
      { en: 'Pulsed-dye laser', ur: 'پلسڈ‑ڈائی لیزر' },
      { en: 'Sclerotherapy', ur: 'اسکلیروتھراپی' },
      { en: 'Surgical excision', ur: 'جراحی اخراج' },
    ],
    conditions: ['infantile-hemangioma', 'port-wine-stain', 'venous-malformation', 'lymphatic-malformation'],
    phone: '+92-21-XXXXXXX',
    website: 'https://indushospital.org.pk',
    geo: { lat: 24.86, lng: 67.0 },
    pos: { x: 0.31, y: 0.9 },
    flagship: true,
  },
  {
    id: 'akuh-karachi',
    name: { en: 'Aga Khan University Hospital', ur: 'آغا خان یونیورسٹی ہسپتال' },
    city: { en: 'Karachi', ur: 'کراچی' },
    province: { en: 'Sindh', ur: 'سندھ' },
    type: 'private',
    services: [
      { en: 'Interventional radiology', ur: 'انٹروینشنل ریڈیولوجی' },
      { en: 'Embolization', ur: 'ایمبولائزیشن' },
      { en: 'Sclerotherapy', ur: 'اسکلیروتھراپی' },
      { en: 'Vascular & paediatric surgery', ur: 'ویسکولر و بچوں کی سرجری' },
    ],
    conditions: ['arteriovenous-malformation', 'venous-malformation', 'lymphatic-malformation'],
    phone: '+92-21-XXXXXXX',
    website: 'https://hospitals.aku.edu',
    geo: { lat: 24.89, lng: 67.07 },
    pos: { x: 0.33, y: 0.92 },
    flagship: true,
  },
  {
    id: 'childrens-lahore',
    name: { en: "The Children's Hospital & ICH", ur: 'دی چلڈرنز ہسپتال و آئی سی ایچ' },
    city: { en: 'Lahore', ur: 'لاہور' },
    province: { en: 'Punjab', ur: 'پنجاب' },
    type: 'public',
    services: [
      { en: 'Paediatric dermatology', ur: 'بچوں کی جلدی امراض' },
      { en: 'Propranolol therapy', ur: 'پروپرانولول علاج' },
      { en: 'Paediatric surgery', ur: 'بچوں کی سرجری' },
    ],
    conditions: ['infantile-hemangioma', 'port-wine-stain'],
    phone: '+92-42-XXXXXXX',
    geo: { lat: 31.56, lng: 74.33 },
    pos: { x: 0.73, y: 0.5 },
    flagship: true,
  },
  {
    id: 'skmch-lahore',
    name: { en: 'Shaukat Khanum Memorial Hospital', ur: 'شوکت خانم میموریل ہسپتال' },
    city: { en: 'Lahore', ur: 'لاہور' },
    province: { en: 'Punjab', ur: 'پنجاب' },
    type: 'trust',
    services: [
      { en: 'Paediatric oncology', ur: 'بچوں کا کینسر علاج' },
      { en: 'Advanced imaging', ur: 'جدید امیجنگ' },
      { en: 'Pathology', ur: 'پیتھالوجی' },
    ],
    conditions: ['infantile-hemangioma'],
    phone: '+92-42-XXXXXXX',
    website: 'https://shaukatkhanum.org.pk',
    geo: { lat: 31.47, lng: 74.27 },
    pos: { x: 0.71, y: 0.52 },
  },
  {
    id: 'pims-islamabad',
    name: { en: 'PIMS (Children Hospital)', ur: 'پمز (چلڈرن ہسپتال)' },
    city: { en: 'Islamabad', ur: 'اسلام آباد' },
    province: { en: 'Federal Capital', ur: 'وفاقی دارالحکومت' },
    type: 'public',
    services: [
      { en: 'Paediatric surgery', ur: 'بچوں کی سرجری' },
      { en: 'Paediatric medicine', ur: 'بچوں کی طب' },
    ],
    conditions: ['infantile-hemangioma', 'lymphatic-malformation'],
    phone: '+92-51-XXXXXXX',
    geo: { lat: 33.7, lng: 73.05 },
    pos: { x: 0.63, y: 0.3 },
  },
  {
    id: 'mayo-lahore',
    name: { en: 'Mayo Hospital / KEMU', ur: 'میو ہسپتال / کے ای ایم یو' },
    city: { en: 'Lahore', ur: 'لاہور' },
    province: { en: 'Punjab', ur: 'پنجاب' },
    type: 'public',
    services: [
      { en: 'Dermatology', ur: 'جلدی امراض' },
      { en: 'Plastic surgery', ur: 'پلاسٹک سرجری' },
    ],
    conditions: ['port-wine-stain', 'venous-malformation'],
    phone: '+92-42-XXXXXXX',
    geo: { lat: 31.58, lng: 74.31 },
    pos: { x: 0.75, y: 0.49 },
  },
  {
    id: 'lrh-peshawar',
    name: { en: 'Lady Reading Hospital', ur: 'لیڈی ریڈنگ ہسپتال' },
    city: { en: 'Peshawar', ur: 'پشاور' },
    province: { en: 'Khyber Pakhtunkhwa', ur: 'خیبر پختونخوا' },
    type: 'public',
    services: [
      { en: 'Paediatric surgery', ur: 'بچوں کی سرجری' },
      { en: 'Dermatology', ur: 'جلدی امراض' },
    ],
    conditions: ['infantile-hemangioma'],
    phone: '+92-91-XXXXXXX',
    geo: { lat: 34.01, lng: 71.57 },
    pos: { x: 0.5, y: 0.27 },
  },
  {
    id: 'nishtar-multan',
    name: { en: 'Nishtar Hospital', ur: 'نشتر ہسپتال' },
    city: { en: 'Multan', ur: 'ملتان' },
    province: { en: 'Punjab', ur: 'پنجاب' },
    type: 'public',
    services: [
      { en: 'Paediatric medicine', ur: 'بچوں کی طب' },
      { en: 'Surgery', ur: 'سرجری' },
    ],
    conditions: ['infantile-hemangioma', 'port-wine-stain'],
    phone: '+92-61-XXXXXXX',
    geo: { lat: 30.2, lng: 71.45 },
    pos: { x: 0.56, y: 0.62 },
  },
  {
    id: 'civil-quetta',
    name: { en: 'Bolan Medical Complex', ur: 'بولان میڈیکل کمپلیکس' },
    city: { en: 'Quetta', ur: 'کوئٹہ' },
    province: { en: 'Balochistan', ur: 'بلوچستان' },
    type: 'public',
    services: [{ en: 'Paediatric medicine', ur: 'بچوں کی طب' }],
    conditions: ['infantile-hemangioma'],
    phone: '+92-81-XXXXXXX',
    geo: { lat: 30.18, lng: 66.99 },
    pos: { x: 0.24, y: 0.6 },
  },
];

export const PROVINCES: LocalizedString[] = [
  { en: 'Sindh', ur: 'سندھ' },
  { en: 'Punjab', ur: 'پنجاب' },
  { en: 'Khyber Pakhtunkhwa', ur: 'خیبر پختونخوا' },
  { en: 'Balochistan', ur: 'بلوچستان' },
  { en: 'Federal Capital', ur: 'وفاقی دارالحکومت' },
];
