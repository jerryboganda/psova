import type { LocalizedString } from './conditions';

export type EventPerson = {
  name: LocalizedString;
  role: LocalizedString;
};

/** A person listed on a poster; names stay in Latin script in both locales. */
export type Person = { name: string; role: LocalizedString };

export type ScheduleRow = {
  time: string;
  speaker?: string;
  role?: LocalizedString;
  topic: LocalizedString;
  /** Rows such as tea breaks are drawn as a full-width highlighted line. */
  highlight?: boolean;
};

export type ScheduleBlock = {
  title?: LocalizedString;
  chairs?: string;
  rows: ScheduleRow[];
};

export type EventDetails = {
  start: string; // ISO datetime with offset
  end: string;
  venue: LocalizedString;
  poster: string; // path under /public
  focus?: LocalizedString[];
  speaker?: EventPerson;
  patron?: EventPerson;
  audience?: LocalizedString;
  contact?: { name: LocalizedString; phone: string }; // phone in E.164
  free?: boolean;
  /** Theme line printed on the cover poster. */
  theme?: LocalizedString;
  about?: LocalizedString;
  stats?: { value: string; label: 'founded' | 'members' | 'cities' }[];
  /** Side events (e.g. a pre-conference workshop). */
  sessions?: {
    label: LocalizedString;
    start: string;
    end: string;
    speaker: Person;
    topic: LocalizedString;
  }[];
  schedule?: ScheduleBlock[];
  featuredSpeakers?: Person[];
  committees?: { title: LocalizedString; members: Person[] }[];
  partners?: string[];
  /** Extra posters shown in the gallery, after `poster`. */
  gallery?: { src: string; alt: LocalizedString }[];
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

const GMCTH: LocalizedString = {
  en: 'Gujranwala Medical College Teaching Hospital, Gujranwala',
  ur: 'گوجرانوالہ میڈیکل کالج ٹیچنگ ہسپتال، گوجرانوالہ',
};

const p = (name: string, en: string, ur: string): Person => ({ name, role: { en, ur } });
const t = (en: string, ur: string): LocalizedString => ({ en, ur });
// Same text in both locales (English-only titles and proper nouns on the posters).
const same = (s: string): LocalizedString => ({ en: s, ur: s });

const GMC_FRONT = '/events/psova-2025';

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
  {
    id: '2nd-international-vascular-anomaly-conference-2025',
    kind: 'event',
    date: '2025-09-27',
    title: {
      en: '2nd International Vascular Anomaly Conference — Vascular Horizons',
      ur: 'دوسری بین الاقوامی ویسکولر ایناملی کانفرنس — ویسکولر ہورائزنز',
    },
    excerpt: {
      en: 'PSOVA’s second international conference at Gujranwala Medical College Teaching Hospital: a full scientific programme with national and international faculty, a residents’ forum, and a pre-conference workshop on varicose vein treatment.',
      ur: 'گوجرانوالہ میڈیکل کالج ٹیچنگ ہسپتال میں پی ایس او وی اے کی دوسری بین الاقوامی کانفرنس: ملکی اور غیر ملکی ماہرین پر مشتمل مکمل سائنسی پروگرام، ریزیڈنٹس فورم اور وریدوں کے پھولنے (ویریکوز وینز) کے علاج پر پری کانفرنس ورکشاپ۔',
    },
    tag: { en: 'Conference', ur: 'کانفرنس' },
    event: {
      start: '2025-09-27T08:00:00+05:00',
      end: '2025-09-27T14:00:00+05:00',
      venue: {
        en: 'Maroof Aziz Auditorium, 3rd Floor, Gujranwala Medical College Teaching Hospital, Gujranwala',
        ur: 'معروف عزیز آڈیٹوریم، تیسری منزل، گوجرانوالہ میڈیکل کالج ٹیچنگ ہسپتال، گوجرانوالہ',
      },
      poster: `${GMC_FRONT}/cover.webp`,
      theme: t(
        'Vascular Horizons: Shaping The Future And Interventional In Pakistan.',
        'ویسکولر ہورائزنز: پاکستان میں مستقبل اور انٹروینشنل علاج کی تشکیل۔',
      ),
      patron: {
        name: { en: 'Prof. Dr. Iqbal Hussain Dogar', ur: 'پروفیسر ڈاکٹر اقبال حسین ڈوگر' },
        role: {
          en: 'Principal, Gujranwala Medical College — Patron',
          ur: 'پرنسپل، گوجرانوالہ میڈیکل کالج — سرپرست',
        },
      },
      about: t(
        'Pakistan Society of Vascular Anomalies (PSOVA) is a multidisciplinary community focused on education, research, and patient care for vascular tumors and malformations. We bring together clinicians and scientists in pediatric surgery, plastic surgery, dermatology, interventional radiology, oncology, pathology, and allied specialties.',
        'پاکستان سوسائٹی آف ویسکولر ایناملیز (پی ایس او وی اے) ایک کثیر الشعبہ برادری ہے جو ویسکولر ٹیومرز اور مالفارمیشنز کے لیے تعلیم، تحقیق اور مریضوں کی نگہداشت پر توجہ دیتی ہے۔ ہم پیڈیاٹرک سرجری، پلاسٹک سرجری، ڈرمیٹالوجی، انٹروینشنل ریڈیالوجی، آنکولوجی، پیتھالوجی اور متعلقہ شعبوں کے معالجین اور سائنس دانوں کو یکجا کرتے ہیں۔',
      ),
      stats: [
        { value: '2019', label: 'founded' },
        { value: '500+', label: 'members' },
        { value: '10+', label: 'cities' },
      ],
      sessions: [
        {
          label: t('Pre-seminar workshop', 'پری سیمینار ورکشاپ'),
          start: '2025-09-20T10:00:00+05:00',
          end: '2025-09-20T13:00:00+05:00',
          speaker: p('Prof. Dr. Muhammad Fiaz', 'Interventional Radiologist', 'انٹروینشنل ریڈیالوجسٹ'),
          topic: t(
            'Varicose Veins: latest treatment with RFA, MW and EVLT (laser treatment), and sclerotherapy',
            'ویریکوز وینز: آر ایف اے، ایم ڈبلیو اور ای وی ایل ٹی (لیزر علاج) اور سکلیروتھراپی کے ذریعے جدید علاج',
          ),
        },
      ],
      schedule: [
        {
          rows: [
            { time: '8:00 – 8:45 AM', topic: t('Reception and Registration', 'استقبالیہ اور رجسٹریشن') },
            { time: '8:45 – 9:00 AM', topic: t('Welcome and Recitation of Holy Quran and Naat', 'خیرمقدم، تلاوتِ قرآنِ پاک اور نعت') },
            { time: '9:00 – 9:10 AM', speaker: 'Prof. Iqbal Hussain Dogar', topic: t('Welcome address of PSOVA', 'پی ایس او وی اے کی جانب سے خطبۂ استقبالیہ') },
            { time: '9:10 – 9:30 AM', speaker: 'Prof. Aftab Mohsin', topic: t('Keynote Speaker', 'کلیدی خطاب') },
          ],
        },
        {
          title: t('Session 1', 'سیشن 1'),
          chairs: 'Prof. Mahfooz, Prof. Farooq Afzal, Prof. Atif Shehzad, Prof. Dr. Khwaja Khursheed',
          rows: [
            { time: '9:30 – 9:45 AM', speaker: 'Prof. Dr. Arshad Taqi', role: t('Consultant Anesthetist, Ex President PMC', 'کنسلٹنٹ اینستھیزیسٹ، سابق صدر پی ایم سی'), topic: same('Anaesthesia Challenges In Extensive Head And Neck Malformations') },
            { time: '9:45 – 10:00 AM', speaker: 'Dr. Shehbaz Qazi', role: t('Vascular and Interventional Radiologist', 'ویسکولر اور انٹروینشنل ریڈیالوجسٹ'), topic: same('Trans-arterial treatment of high flow AVM — a service established in Pakistan') },
            { time: '10:00 – 10:15 AM', speaker: 'Dr. Anne Marie', role: t('Interventional Head of CHOP USA', 'انٹروینشنل ہیڈ، سی ایچ او پی، امریکا'), topic: same('Overgrowth Syndromes') },
            { time: '10:15 – 10:30 AM', speaker: 'Prof. Dr. Asif Qureshi', role: t('Paediatric Surgery', 'پیڈیاٹرک سرجری'), topic: same('Management of Macrocystic Lymphatic Malformations / Cystic Hygroma') },
            { time: '10:30 – 10:45 AM', speaker: 'Prof. Dr. Ilyas Sadiq', role: t('Consultant Vascular & Endovascular Surgeon', 'کنسلٹنٹ ویسکولر اور اینڈوویسکولر سرجن'), topic: same('Surgical and Foam Sclerotherapy Management of Vascular Anomalies: A Vascular Surgeon’s Approach') },
            { time: '10:45 – 11:00 AM', speaker: 'Prof. Dr. Saqib Mahmood', role: t('Professor of Human Genetics & Molecular Biology', 'پروفیسر آف ہیومن جینیٹکس اینڈ مالیکیولر بایولوجی'), topic: same('Vascular Anomalies — ISSVA genetics perspective') },
            { time: '11:00 – 11:30 AM', topic: t('Tea Break', 'چائے کا وقفہ'), highlight: true },
          ],
        },
        {
          title: t('Session 2', 'سیشن 2'),
          chairs: 'Prof. Atif Kazmi, Prof. Iqbal Hussain Dogar, Dr. Najam-us Sehr',
          rows: [
            { time: '11:30 – 11:45 AM', speaker: 'Prof. Dr. Faria Altaf', role: t('Head of Dermatology (SIMS)', 'سربراہ ڈرمیٹالوجی (ایس آئی ایم ایس)'), topic: same('Infantile hemangiomas; When to worry and when to treat') },
            { time: '11:45 AM – 12:00 PM', speaker: 'Prof. Nadia Ali Azfar', role: t('Head of Dermatology Unit 2, Jinnah Hospital Lahore', 'سربراہ ڈرمیٹالوجی یونٹ 2، جناح ہسپتال لاہور'), topic: same('Lymphatic Malformation: Dermatologic Diagnosis and Evolving Therapies') },
            { time: '12:00 – 12:15 PM', speaker: 'Dr. Tahir Kamal', role: t('Associate Professor, Al-Aleem Medical College', 'ایسوسی ایٹ پروفیسر، العلیم میڈیکل کالج'), topic: same('Targeted Therapy and Aesthetic Challenges in Cutaneous Vascular Lesions Management') },
            { time: '12:15 – 12:30 PM', speaker: 'Dr. Muhammad Kashif Shazlee', role: t('Associate Professor & Interventional Radiologist, Abu Dhabi/Dubai', 'ایسوسی ایٹ پروفیسر و انٹروینشنل ریڈیالوجسٹ، ابوظہبی/دبئی'), topic: same('Developing Vascular Anomaly Clinic in a resource constraint environment — our experience') },
          ],
        },
        {
          title: t('Residents Forum for Vascular Anomalies', 'ویسکولر ایناملیز کے لیے ریزیڈنٹس فورم'),
          rows: [
            { time: '12:30 – 12:38 PM', speaker: 'Dr. Aqib Javaid', role: t('4th year PGR, Children Hospital Lahore', 'چوتھے سال کے پوسٹ گریجویٹ ریزیڈنٹ، چلڈرن ہسپتال لاہور'), topic: same('Vascular Malformations: what a radiology resident needs to know') },
            { time: '12:38 – 12:45 PM', topic: t('Dermatology Perspective', 'ڈرمیٹالوجی کا نقطۂ نظر') },
            { time: '12:45 – 1:00 PM', topic: t('Q & A', 'سوال و جواب') },
            { time: '1:00 – 2:00 PM', speaker: 'Prof. Dr. Iqbal Hussain Dogar, Prof. Aftab Mohsin, Prof. Dr. Nabila Talat, Prof. Dr. Muhammad Saleem, Dr. Rashid Usman, Prof. Ijaz Hussain, and others', topic: t('Panel Discussion', 'پینل ڈسکشن') },
            { time: '2:00 PM', topic: t('Refreshments', 'ریفریشمنٹ'), highlight: true },
          ],
        },
      ],
      featuredSpeakers: [
        p('Prof. Dr. Javed Akram', 'Chairman Board of Directors, PSIM', 'چیئرمین بورڈ آف ڈائریکٹرز، پی ایس آئی ایم'),
        p('Prof. Dr. Aftab Mohsin', 'President, Pakistan Society of Internal Medicine', 'صدر، پاکستان سوسائٹی آف انٹرنل میڈیسن'),
        p('Dr. Anne Marie Cahill', 'Chief, Division of Interventional Radiology, Children’s Hospital of Philadelphia Research Institute', 'چیف، ڈویژن آف انٹروینشنل ریڈیالوجی، چلڈرنز ہسپتال آف فلاڈیلفیا ریسرچ انسٹی ٹیوٹ'),
        p('Prof. Dr. Nabila Talat', 'Dean Pediatric Surgery & Allied, Registrar UCHS; Founding Vice President MVAP', 'ڈین پیڈیاٹرک سرجری اینڈ الائیڈ، رجسٹرار یو سی ایچ ایس؛ بانی نائب صدر ایم وی اے پی'),
        p('Prof. Dr. Muhammad Asif Qureshi', 'Principal, DG Khan Medical College & Head of Pediatric Surgery Department', 'پرنسپل، ڈی جی خان میڈیکل کالج و سربراہ شعبہ پیڈیاٹرک سرجری'),
        p('Prof. Dr. Faria Altaf', 'Head of Dermatology Services, Institute of Medical Sciences', 'سربراہ ڈرمیٹالوجی سروسز، انسٹی ٹیوٹ آف میڈیکل سائنسز'),
        p('Prof. Dr. Nadia Ali Azfar', 'Head of Dermatology, Jinnah Hospital Lahore', 'سربراہ ڈرمیٹالوجی، جناح ہسپتال لاہور'),
        p('Prof. Dr. Tahir Kamal', 'Associate Professor & Head of Dermatology, Al-Aleem Medical College, Lahore', 'ایسوسی ایٹ پروفیسر و سربراہ ڈرمیٹالوجی، العلیم میڈیکل کالج لاہور'),
        p('Prof. Dr. Arshad Taqi', 'Consultant Anesthetist, Ex President PMC', 'کنسلٹنٹ اینستھیزیسٹ، سابق صدر پی ایم سی'),
        p('Prof. Dr. Mehmood Shoukat', 'Consultant Pediatric Surgeon, Ex Dean AIMC', 'کنسلٹنٹ پیڈیاٹرک سرجن، سابق ڈین اے آئی ایم سی'),
        p('Prof. Dr. Muhammad Saleem', 'Consultant Pediatric Surgeon; Ex Dean & MD, The Children Hospital Lahore', 'کنسلٹنٹ پیڈیاٹرک سرجن؛ سابق ڈین و ایم ڈی، دی چلڈرن ہسپتال لاہور'),
        p('Prof. Dr. Muhammad Farooq Afzal', 'Principal AMC, PGMI, LGH, Lahore', 'پرنسپل اے ایم سی، پی جی ایم آئی، ایل جی ایچ، لاہور'),
        p('Prof. Dr. Saqib Mahmood', 'Professor of Human Genetics & Molecular Biology', 'پروفیسر آف ہیومن جینیٹکس اینڈ مالیکیولر بایولوجی'),
        p('Prof. Dr. Shahbaz Ahmad Qazi', 'Vascular & Interventional Radiologist; King Abdulaziz Medical City – National Guard Health Affairs, Riyadh', 'ویسکولر اور انٹروینشنل ریڈیالوجسٹ؛ کنگ عبدالعزیز میڈیکل سٹی – نیشنل گارڈ ہیلتھ افیئرز، ریاض'),
        p('Prof. Dr. Muhammad Kashif Shazlee', 'Ex HOD Radiology, Dr Ziauddin Hospital', 'سابق سربراہ شعبہ ریڈیالوجی، ڈاکٹر ضیاء الدین ہسپتال'),
        p('Prof. Dr. Ilyas Sadiq', 'Consultant Vascular Surgeon, Doctors Hospital Lahore', 'کنسلٹنٹ ویسکولر سرجن، ڈاکٹرز ہسپتال لاہور'),
        p('Prof. Dr. Rashid Usman', 'Consultant Vascular Surgeon', 'کنسلٹنٹ ویسکولر سرجن'),
        p('Dr. Aqib Javid', '4th year postgraduate resident, Children Hospital Lahore', 'چوتھے سال کے پوسٹ گریجویٹ ریزیڈنٹ، چلڈرن ہسپتال لاہور'),
      ],
      committees: [
        {
          title: t('Organizing Committee', 'آرگنائزنگ کمیٹی'),
          members: [
            p('Prof. Dr. Iqbal Hussain Dogar', 'Principal, GMC Gujranwala — Patron', 'پرنسپل، جی ایم سی گوجرانوالہ — سرپرست'),
            p('Prof. Dr. Imran Khokhar', 'Professor of Surgery — Chairman', 'پروفیسر آف سرجری — چیئرمین'),
            p('Prof. Dr. Zulfiqar Ali', 'Professor of Pediatrics', 'پروفیسر آف پیڈیاٹرکس'),
            p('Prof. Dr. Nabila Talat', 'University of Child Health Sciences', 'یونیورسٹی آف چائلڈ ہیلتھ سائنسز'),
            p('Dr. Nabeela Shahzadi', 'Associate Professor of Dermatology', 'ایسوسی ایٹ پروفیسر آف ڈرمیٹالوجی'),
            p('Dr. Naveed Yaseen', 'Maxillofacial Surgeon', 'میکسیلوفیشل سرجن'),
          ],
        },
        {
          title: t('Scientific Committee', 'سائنسی کمیٹی'),
          members: [
            p('Prof. Dr. Nabila Talat', 'University of Child Health Sciences — Chairman', 'یونیورسٹی آف چائلڈ ہیلتھ سائنسز — چیئرمین'),
            p('Dr. Afshin Oneeb', 'Associate Professor of Pediatrics', 'ایسوسی ایٹ پروفیسر آف پیڈیاٹرکس'),
            p('Dr. Mahym Mansoor', 'Assistant Professor of Dermatology', 'اسسٹنٹ پروفیسر آف ڈرمیٹالوجی'),
            p('Dr. Salman Saleem', 'Pediatric Surgery', 'پیڈیاٹرک سرجری'),
          ],
        },
      ],
      partners: [
        'CEMB',
        'Department of Dermatology',
        'University of Child Health Sciences',
        'PRSP',
        'PSIM',
        'Pakistan Association of Dermatologists',
        'Association of Paediatric Surgeons of Pakistan',
        'IRSP',
        'Society of Surgeons of Pakistan, Gujranwala',
      ],
      gallery: [
        { src: `${GMC_FRONT}/programme.webp`, alt: t('Scientific sessions programme poster', 'سائنسی سیشنز کے پروگرام کا پوسٹر') },
        { src: `${GMC_FRONT}/speakers-1.webp`, alt: t('Featured speakers poster', 'نمایاں مقررین کا پوسٹر') },
        { src: `${GMC_FRONT}/speakers-2.webp`, alt: t('More speakers poster', 'مزید مقررین کا پوسٹر') },
        { src: `${GMC_FRONT}/committees.webp`, alt: t('Organizing and scientific committees poster', 'آرگنائزنگ اور سائنسی کمیٹیوں کا پوسٹر') },
        { src: `${GMC_FRONT}/patron.webp`, alt: t('Patron poster: Prof. Dr. Iqbal Hussain Dogar', 'سرپرست کا پوسٹر: پروفیسر ڈاکٹر اقبال حسین ڈوگر') },
        { src: `${GMC_FRONT}/workshop.webp`, alt: t('Pre-seminar workshop poster: Prof. Dr. Muhammad Fiaz', 'پری سیمینار ورکشاپ کا پوسٹر: پروفیسر ڈاکٹر محمد فیاض') },
      ],
    },
  },
  {
    id: 'first-international-vascular-anomaly-seminar-2023',
    kind: 'event',
    date: '2023-12-16',
    title: {
      en: '1st International Vascular Anomaly Seminar',
      ur: 'پہلا بین الاقوامی ویسکولر ایناملی سیمینار',
    },
    excerpt: {
      en: 'PSOVA’s first international vascular anomaly seminar, held at Gujranwala Medical College Teaching Hospital on 16 December 2023.',
      ur: 'پی ایس او وی اے کا پہلا بین الاقوامی ویسکولر ایناملی سیمینار، جو 16 دسمبر 2023 کو گوجرانوالہ میڈیکل کالج ٹیچنگ ہسپتال میں منعقد ہوا۔',
    },
    tag: { en: 'Seminar', ur: 'سیمینار' },
    body: {
      en: `Held on Saturday 16 December 2023 at ${GMCTH.en}, the seminar was PSOVA’s first international gathering on vascular anomalies, bringing clinicians together to advance knowledge and collaboration in the field. It was followed by the 2nd International Vascular Anomaly Conference on 27 September 2025.`,
      ur: `ہفتہ 16 دسمبر 2023 کو ${GMCTH.ur} میں منعقد ہونے والا یہ سیمینار ویسکولر ایناملیز پر پی ایس او وی اے کا پہلا بین الاقوامی اجتماع تھا، جس میں معالجین نے اس شعبے میں علم اور باہمی تعاون کو آگے بڑھانے کے لیے شرکت کی۔ اس کے بعد 27 ستمبر 2025 کو دوسری بین الاقوامی ویسکولر ایناملی کانفرنس منعقد ہوئی۔`,
    },
  },
];
