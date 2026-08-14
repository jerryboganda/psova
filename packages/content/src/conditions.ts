export type LocalizedString = { en: string; ur: string };

export type Condition = {
  slug: string;
  category: 'tumor' | 'malformation';
  name: LocalizedString;
  short: LocalizedString; // short label for chips / anatomy hotspots
  tagline: LocalizedString;
  summary: LocalizedString;
  ageOnset: LocalizedString;
  prevalence: LocalizedString;
  signs: LocalizedString[];
  diagnosis: LocalizedString;
  treatment: LocalizedString;
  whenToSeeDoctor: LocalizedString;
  // Accent color used across cards and the anatomy explorer.
  accent: string;
  // Normalised position (0..1) on the stylised body figure for the anatomy explorer.
  hotspot: { x: number; y: number };
};

export const CONDITIONS: Condition[] = [
  {
    slug: 'infantile-hemangioma',
    category: 'tumor',
    name: { en: 'Infantile Hemangioma', ur: 'بچپن کا ہیمانجیوما (اسٹرابیری مارک)' },
    short: { en: 'Hemangioma', ur: 'ہیمانجیوما' },
    tagline: {
      en: 'The most common birthmark of infancy — it grows, then shrinks.',
      ur: 'بچپن کا سب سے عام پیدائشی نشان — پہلے بڑھتا ہے، پھر سکڑ جاتا ہے۔',
    },
    summary: {
      en: 'Infantile hemangioma is the most common vascular tumour of infancy. It is usually not visible at birth, appears in the first few weeks of life, grows quickly over the first months, then slowly shrinks and fades from around the first birthday. Most need no treatment, but those near the eye, lips, or airway, or that ulcerate, are treatable.',
      ur: 'بچپن کا ہیمانجیوما نوزائیدہ بچوں میں خون کی نالیوں کا سب سے عام ٹیومر ہے۔ یہ عام طور پر پیدائش کے وقت نظر نہیں آتا، زندگی کے پہلے چند ہفتوں میں نمودار ہوتا ہے، پہلے مہینوں میں تیزی سے بڑھتا ہے، پھر پہلی سالگرہ کے قریب آہستہ آہستہ سکڑ جاتا ہے۔ زیادہ تر کو علاج کی ضرورت نہیں ہوتی، لیکن آنکھ، ہونٹ یا سانس کی نالی کے قریب والے قابلِ علاج ہیں۔',
    },
    ageOnset: { en: 'First weeks of life', ur: 'زندگی کے پہلے ہفتے' },
    prevalence: { en: '~4–5% of infants', ur: 'تقریباً 4–5% بچے' },
    signs: [
      { en: 'Bright red, raised "strawberry" patch', ur: 'چمکدار سرخ، ابھرا ہوا "اسٹرابیری" دھبہ' },
      { en: 'Rapid growth in the first months', ur: 'پہلے مہینوں میں تیز نمو' },
      { en: 'Slow fading after the first year', ur: 'پہلے سال کے بعد آہستہ مدھم ہونا' },
    ],
    diagnosis: {
      en: 'Usually diagnosed by an experienced doctor on examination and history. Ultrasound or MRI is used for deep or complex lesions.',
      ur: 'عام طور پر تجربہ کار ڈاکٹر معائنے اور تاریخ سے تشخیص کرتا ہے۔ گہرے یا پیچیدہ کیسز کے لیے الٹراساؤنڈ یا ایم آر آئی استعمال ہوتا ہے۔',
    },
    treatment: {
      en: 'Many simply need monitoring. Problematic ones respond well to a medicine called propranolol; topical timolol and laser are also used.',
      ur: 'بہت سوں کو صرف نگرانی کی ضرورت ہوتی ہے۔ مسئلہ پیدا کرنے والوں پر "پروپرانولول" دوا خوب اثر کرتی ہے؛ ٹاپیکل ٹیمولول اور لیزر بھی استعمال ہوتے ہیں۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist if it is near the eye, lip, nose, or airway, grows very fast, bleeds, or forms an open sore.',
      ur: 'اگر یہ آنکھ، ہونٹ، ناک یا سانس کی نالی کے قریب ہو، بہت تیزی سے بڑھے، خون بہے یا زخم بن جائے تو ماہر سے رجوع کریں۔',
    },
    accent: '#ff4d6d',
    hotspot: { x: 0.58, y: 0.16 },
  },
  {
    slug: 'port-wine-stain',
    category: 'malformation',
    name: { en: 'Port-Wine Stain', ur: 'پورٹ‑وائن داغ (کیپلری میل‑فارمیشن)' },
    short: { en: 'Port-Wine Stain', ur: 'پورٹ‑وائن داغ' },
    tagline: {
      en: 'A flat birthmark that is present from birth and is permanent.',
      ur: 'ایک چپٹا پیدائشی نشان جو پیدائش سے موجود اور مستقل ہوتا ہے۔',
    },
    summary: {
      en: 'A capillary malformation — a flat pink, red, or purple mark caused by widened capillaries. Present at birth and permanent; it does not fade like a hemangioma and can darken over years. Usually cosmetic, but a facial stain near the eye or forehead warrants a check for Sturge-Weber syndrome.',
      ur: 'یہ ایک کیپلری میل‑فارمیشن ہے — چوڑی کیپلریوں کی وجہ سے بننے والا چپٹا گلابی، سرخ یا جامنی نشان۔ پیدائش سے موجود اور مستقل؛ یہ ہیمانجیوما کی طرح مدھم نہیں ہوتا اور برسوں میں گہرا ہو سکتا ہے۔ عموماً ظاہری، لیکن آنکھ یا پیشانی کے قریب چہرے کا نشان سٹرج‑ویبر سنڈروم کی جانچ کا تقاضا کرتا ہے۔',
    },
    ageOnset: { en: 'Present at birth', ur: 'پیدائش سے موجود' },
    prevalence: { en: '~0.3% of newborns', ur: 'تقریباً 0.3% نوزائیدہ' },
    signs: [
      { en: 'Flat pink to deep purple patch', ur: 'چپٹا گلابی تا گہرا جامنی دھبہ' },
      { en: 'Does not fade; may thicken with age', ur: 'مدھم نہیں ہوتا؛ عمر کے ساتھ گاڑھا ہو سکتا ہے' },
      { en: 'Often on the face or a limb', ur: 'اکثر چہرے یا کسی عضو پر' },
    ],
    diagnosis: {
      en: 'Diagnosed on appearance. A facial stain near the eye/forehead may prompt an eye exam and brain MRI to check for Sturge-Weber syndrome.',
      ur: 'ظاہری شکل سے تشخیص ہوتی ہے۔ آنکھ/پیشانی کے قریب چہرے کا نشان سٹرج‑ویبر کی جانچ کے لیے آنکھ کے معائنے اور دماغی ایم آر آئی کا سبب بن سکتا ہے۔',
    },
    treatment: {
      en: 'Pulsed-dye laser can lighten the colour and works best when started early. Camouflage make-up can help too.',
      ur: 'پلسڈ‑ڈائی لیزر رنگ ہلکا کر سکتا ہے اور جلد شروع کرنے پر بہترین کام کرتا ہے۔ کیموفلاج میک اپ بھی مددگار ہے۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist for any facial stain near the eye/forehead, or if you want laser treatment.',
      ur: 'آنکھ/پیشانی کے قریب چہرے کے کسی بھی نشان کے لیے، یا لیزر علاج چاہیں تو ماہر سے رجوع کریں۔',
    },
    accent: '#b14dff',
    hotspot: { x: 0.45, y: 0.12 },
  },
  {
    slug: 'venous-malformation',
    category: 'malformation',
    name: { en: 'Venous Malformation', ur: 'وریدی خرابی (وینس میل‑فارمیشن)' },
    short: { en: 'Venous Malformation', ur: 'وریدی خرابی' },
    tagline: {
      en: 'A soft, bluish, low-flow tangle of abnormal veins.',
      ur: 'غیر معمولی رگوں کا نرم، نیلگوں، کم‑بہاؤ والا گچھا۔',
    },
    summary: {
      en: 'A tangle of abnormally formed veins, present from birth though sometimes noticed later. It appears as a soft, bluish, compressible swelling that may swell when the area is lowered or during exertion and can ache. It is "low-flow".',
      ur: 'غیر معمولی طور پر بنی ہوئی رگوں کا گچھا، پیدائش سے موجود اگرچہ کبھی بعد میں محسوس ہوتا ہے۔ یہ نرم، نیلگوں، دبنے والی سوجن کی صورت میں ظاہر ہوتا ہے جو حصہ نیچے کرنے یا محنت کے دوران پھول سکتا ہے اور درد کر سکتا ہے۔ یہ "کم‑بہاؤ" والا ہوتا ہے۔',
    },
    ageOnset: { en: 'From birth; grows with the child', ur: 'پیدائش سے؛ بچے کے ساتھ بڑھتا ہے' },
    prevalence: { en: 'Most common malformation', ur: 'سب سے عام میل‑فارمیشن' },
    signs: [
      { en: 'Soft bluish, compressible swelling', ur: 'نرم نیلگوں، دبنے والی سوجن' },
      { en: 'Swells when lowered or with activity', ur: 'نیچے کرنے یا سرگرمی پر پھولنا' },
      { en: 'May ache, especially mornings', ur: 'درد ہو سکتا ہے، خاص طور پر صبح' },
    ],
    diagnosis: {
      en: 'Ultrasound confirms low flow; MRI shows depth and extent for treatment planning.',
      ur: 'الٹراساؤنڈ کم بہاؤ کی تصدیق کرتا ہے؛ ایم آر آئی علاج کی منصوبہ بندی کے لیے گہرائی اور پھیلاؤ دکھاتا ہے۔',
    },
    treatment: {
      en: 'Compression garments, sclerotherapy (an injection that shrinks the vessels), laser, surgery, and sometimes the medicine sirolimus.',
      ur: 'کمپریشن گارمنٹس، اسکلیروتھراپی (ایک انجیکشن جو نالیوں کو سکیڑتا ہے)، لیزر، سرجری، اور کبھی دوا سائرولیمس۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist for pain, rapid growth, clotting, or if a swelling limits movement.',
      ur: 'درد، تیز نمو، خون جمنے، یا سوجن سے حرکت محدود ہونے پر ماہر سے رجوع کریں۔',
    },
    accent: '#4d8bff',
    hotspot: { x: 0.62, y: 0.62 },
  },
  {
    slug: 'lymphatic-malformation',
    category: 'malformation',
    name: { en: 'Lymphatic Malformation', ur: 'لمفی خرابی (لمفیٹک میل‑فارمیشن)' },
    short: { en: 'Lymphatic Malformation', ur: 'لمفی خرابی' },
    tagline: {
      en: 'Fluid-filled cysts from abnormal lymphatic channels.',
      ur: 'غیر معمولی لمفی نالیوں سے بننے والے سیال سے بھرے سسٹ۔',
    },
    summary: {
      en: 'Abnormally formed lymphatic (fluid-drainage) channels that create fluid-filled cysts, often noticed in infancy or early childhood, commonly in the head and neck. They can suddenly enlarge with infection or bleeding, and are described as macrocystic (large cysts) or microcystic (tiny cysts).',
      ur: 'غیر معمولی طور پر بنی لمفی (سیال نکاسی) نالیاں جو سیال سے بھرے سسٹ بناتی ہیں، اکثر بچپن یا ابتدائی عمر میں محسوس ہوتی ہیں، عام طور پر سر اور گردن میں۔ یہ انفیکشن یا خون بہنے سے اچانک بڑھ سکتی ہیں، اور بڑے سسٹ (میکروسسٹک) یا چھوٹے سسٹ (مائیکروسسٹک) کہلاتی ہیں۔',
    },
    ageOnset: { en: 'Infancy / early childhood', ur: 'بچپن / ابتدائی عمر' },
    prevalence: { en: 'Often head & neck', ur: 'اکثر سر اور گردن' },
    signs: [
      { en: 'Soft swelling that can change in size', ur: 'نرم سوجن جس کا حجم بدل سکتا ہے' },
      { en: 'Sudden enlargement with infection', ur: 'انفیکشن کے ساتھ اچانک بڑھنا' },
      { en: 'Clear or blood-tinged fluid blisters', ur: 'شفاف یا خون آمیز سیال کے چھالے' },
    ],
    diagnosis: {
      en: 'Ultrasound and MRI define the cysts; classified as macrocystic or microcystic to guide treatment.',
      ur: 'الٹراساؤنڈ اور ایم آر آئی سسٹ کی وضاحت کرتے ہیں؛ علاج کے لیے میکروسسٹک یا مائیکروسسٹک میں درجہ بندی ہوتی ہے۔',
    },
    treatment: {
      en: 'Sclerotherapy, surgery, and the medicine sirolimus, which has improved outcomes for complex cases.',
      ur: 'اسکلیروتھراپی، سرجری، اور دوا سائرولیمس، جس نے پیچیدہ کیسز کے نتائج بہتر کیے ہیں۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist for rapid swelling, repeated infections, or pressure on breathing or feeding.',
      ur: 'تیز سوجن، بار بار انفیکشن، یا سانس و خوراک پر دباؤ پر ماہر سے رجوع کریں۔',
    },
    accent: '#2fd4c9',
    hotspot: { x: 0.5, y: 0.27 },
  },
  {
    slug: 'arteriovenous-malformation',
    category: 'malformation',
    name: { en: 'Arteriovenous Malformation (AVM)', ur: 'شریانی‑وریدی خرابی (اے‑وی‑ایم)' },
    short: { en: 'AVM', ur: 'اے‑وی‑ایم' },
    tagline: {
      en: 'A high-flow short-circuit between arteries and veins.',
      ur: 'شریانوں اور رگوں کے درمیان تیز‑بہاؤ والا شارٹ‑سرکٹ۔',
    },
    summary: {
      en: 'A high-flow anomaly where arteries connect directly to veins without the normal capillary network in between. It may feel warm, pulsating, or buzzing, and can grow and cause pain, bleeding, or skin breakdown over time. AVMs are the most challenging malformation to manage.',
      ur: 'ایک تیز‑بہاؤ والی خرابی جہاں شریانیں درمیان میں عام کیپلری نیٹ ورک کے بغیر براہِ راست رگوں سے جڑ جاتی ہیں۔ یہ گرم، دھڑکتا، یا بھنبھناتا محسوس ہو سکتا ہے، اور وقت کے ساتھ بڑھ کر درد، خون بہنے یا جلد کے ٹوٹنے کا سبب بن سکتا ہے۔ اے‑وی‑ایم سب سے مشکل میل‑فارمیشن ہے۔',
    },
    ageOnset: { en: 'Present at birth; may worsen later', ur: 'پیدائش سے موجود؛ بعد میں بگڑ سکتا ہے' },
    prevalence: { en: 'Rare, high-flow', ur: 'نایاب، تیز‑بہاؤ' },
    signs: [
      { en: 'Warmth and a pulsation or "buzz"', ur: 'گرمی اور دھڑکن یا "بھنبھناہٹ"' },
      { en: 'Reddish, growing mass', ur: 'سرخی مائل، بڑھتا ہوا گٹھلا' },
      { en: 'Pain, bleeding, or skin sores over time', ur: 'وقت کے ساتھ درد، خون بہنا یا جلدی زخم' },
    ],
    diagnosis: {
      en: 'Ultrasound shows high flow; MRI/MRA and angiography map the abnormal vessels.',
      ur: 'الٹراساؤنڈ تیز بہاؤ دکھاتا ہے؛ ایم آر آئی/ایم آر اے اور اینجیوگرافی غیر معمولی نالیوں کا نقشہ بناتے ہیں۔',
    },
    treatment: {
      en: 'Best at experienced centres — usually embolization (blocking vessels from inside) combined with surgery.',
      ur: 'تجربہ کار مراکز میں بہترین — عام طور پر ایمبولائزیشن (اندر سے نالیوں کو بند کرنا) سرجری کے ساتھ۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist promptly for a warm, pulsating, or rapidly changing lesion, pain, or bleeding.',
      ur: 'گرم، دھڑکتے، یا تیزی سے بدلتے گھاؤ، درد یا خون بہنے پر فوراً ماہر سے رجوع کریں۔',
    },
    accent: '#ff7a3d',
    hotspot: { x: 0.4, y: 0.5 },
  },
  {
    slug: 'klippel-trenaunay-syndrome',
    category: 'malformation',
    name: { en: 'Klippel-Trenaunay Syndrome', ur: 'کلپل‑ٹریناونے سنڈروم' },
    short: { en: 'KTS', ur: 'کے‑ٹی‑ایس' },
    tagline: {
      en: 'A triad of birthmark, vein changes, and limb overgrowth.',
      ur: 'پیدائشی نشان، رگوں کی تبدیلی اور عضو کی زیادہ نمو کی تثلیث۔',
    },
    summary: {
      en: 'A rare condition usually present at birth: a triad of a capillary malformation (port-wine stain), venous/varicose vein abnormalities, and overgrowth of a limb’s bone and soft tissue — most often affecting one leg. Care focuses on managing symptoms through a multidisciplinary team.',
      ur: 'ایک نایاب کیفیت جو عام طور پر پیدائش سے ہوتی ہے: کیپلری میل‑فارمیشن (پورٹ‑وائن داغ)، وریدی/ویری کوز رگوں کی خرابی، اور کسی عضو کی ہڈی و نرم بافت کی زیادہ نمو کی تثلیث — اکثر ایک ٹانگ متاثر ہوتی ہے۔ علاج کا محور ماہرین کی ٹیم کے ذریعے علامات کا انتظام ہے۔',
    },
    ageOnset: { en: 'Present at birth', ur: 'پیدائش سے موجود' },
    prevalence: { en: 'Rare', ur: 'نایاب' },
    signs: [
      { en: 'Port-wine stain on a limb', ur: 'عضو پر پورٹ‑وائن داغ' },
      { en: 'Varicose / abnormal veins', ur: 'ویری کوز / غیر معمولی رگیں' },
      { en: 'One limb larger or longer', ur: 'ایک عضو بڑا یا لمبا' },
    ],
    diagnosis: {
      en: 'Clinical triad plus ultrasound and MRI to map veins and overgrowth; sometimes genetic testing.',
      ur: 'طبی تثلیث کے ساتھ رگوں اور نمو کے نقشے کے لیے الٹراساؤنڈ و ایم آر آئی؛ کبھی جینیاتی ٹیسٹ۔',
    },
    treatment: {
      en: 'Compression, sclerotherapy, managing limb-length differences, and monitoring for clots — via a coordinated team.',
      ur: 'کمپریشن، اسکلیروتھراپی، عضو کی لمبائی کے فرق کا انتظام، اور خون جمنے کی نگرانی — مربوط ٹیم کے ذریعے۔',
    },
    whenToSeeDoctor: {
      en: 'See a specialist team early to plan limb monitoring, clot prevention, and symptom care.',
      ur: 'عضو کی نگرانی، خون جمنے سے بچاؤ اور علامات کے علاج کی منصوبہ بندی کے لیے جلد ماہر ٹیم سے رجوع کریں۔',
    },
    accent: '#9d4dff',
    hotspot: { x: 0.57, y: 0.8 },
  },
  {
    slug: 'sturge-weber-syndrome',
    category: 'malformation',
    name: { en: 'Sturge-Weber Syndrome', ur: 'سٹرج‑ویبر سنڈروم' },
    short: { en: 'SWS', ur: 'ایس‑ڈبلیو‑ایس' },
    tagline: {
      en: 'A facial port-wine stain with brain and eye involvement.',
      ur: 'چہرے کا پورٹ‑وائن داغ بمع دماغ اور آنکھ کی شمولیت۔',
    },
    summary: {
      en: 'A rare condition from a non-inherited GNAQ gene change, combining a facial port-wine stain (typically over the forehead/upper eyelid) with abnormal blood vessels on the brain and in the eye. This can lead to seizures and glaucoma. Early diagnosis improves outcomes.',
      ur: 'ایک نایاب کیفیت جو غیر موروثی GNAQ جین کی تبدیلی سے ہوتی ہے، جس میں چہرے کا پورٹ‑وائن داغ (عام طور پر پیشانی/اوپری پپوٹے پر) دماغ اور آنکھ کی غیر معمولی نالیوں کے ساتھ ملتا ہے۔ اس سے دورے اور گلوکوما ہو سکتے ہیں۔ جلد تشخیص نتائج بہتر بناتی ہے۔',
    },
    ageOnset: { en: 'Present at birth; seizures often in year 1', ur: 'پیدائش سے؛ دورے اکثر پہلے سال میں' },
    prevalence: { en: 'Rare', ur: 'نایاب' },
    signs: [
      { en: 'Facial port-wine stain (forehead/eyelid)', ur: 'چہرے کا پورٹ‑وائن داغ (پیشانی/پپوٹا)' },
      { en: 'Seizures', ur: 'دورے' },
      { en: 'Raised eye pressure (glaucoma)', ur: 'آنکھ کا بڑھا دباؤ (گلوکوما)' },
    ],
    diagnosis: {
      en: 'Brain MRI and eye examination assess brain and eye involvement; genetic testing can confirm.',
      ur: 'دماغی ایم آر آئی اور آنکھ کا معائنہ دماغ و آنکھ کی شمولیت جانچتے ہیں؛ جینیاتی ٹیسٹ تصدیق کر سکتا ہے۔',
    },
    treatment: {
      en: 'Anti-seizure medicines, glaucoma management, and laser for the birthmark — with lifelong eye monitoring.',
      ur: 'دورے روکنے کی ادویات، گلوکوما کا انتظام، اور نشان کے لیے لیزر — تاحیات آنکھ کی نگرانی کے ساتھ۔',
    },
    whenToSeeDoctor: {
      en: 'A baby with a forehead/eyelid port-wine stain should be assessed early for brain and eye involvement.',
      ur: 'پیشانی/پپوٹے کے پورٹ‑وائن داغ والے بچے کی دماغ و آنکھ کی شمولیت کے لیے جلد جانچ ہونی چاہیے۔',
    },
    accent: '#ff4db8',
    hotspot: { x: 0.42, y: 0.1 },
  },
  {
    slug: 'cloves-syndrome',
    category: 'malformation',
    name: { en: 'CLOVES Syndrome', ur: 'کلووز سنڈروم' },
    short: { en: 'CLOVES', ur: 'کلووز' },
    tagline: {
      en: 'Overgrowth with complex combined malformations.',
      ur: 'زیادہ نمو بمع پیچیدہ مرکب میل‑فارمیشنز۔',
    },
    summary: {
      en: 'A rare overgrowth condition linked to the PIK3CA gene, with fatty overgrowth, complex combined vascular malformations, and skeletal/skin differences. Care is highly individualised and multidisciplinary; targeted medicines that act on the PIK3CA pathway are an emerging option.',
      ur: 'ایک نایاب زیادہ‑نمو والی کیفیت جو PIK3CA جین سے منسلک ہے، جس میں چربی کی زیادہ نمو، پیچیدہ مرکب وریدی میل‑فارمیشنز، اور ہڈی/جلد کے فرق ہوتے ہیں۔ علاج انتہائی انفرادی اور کثیر‑ماہر ہوتا ہے؛ PIK3CA راستے پر اثر کرنے والی ہدف‑شدہ ادویات ایک ابھرتا ہوا اختیار ہیں۔',
    },
    ageOnset: { en: 'Present at birth', ur: 'پیدائش سے موجود' },
    prevalence: { en: 'Very rare', ur: 'بہت نایاب' },
    signs: [
      { en: 'Soft fatty overgrowth (often trunk)', ur: 'نرم چربیلی زیادہ نمو (اکثر دھڑ)' },
      { en: 'Combined vascular malformations', ur: 'مرکب وریدی میل‑فارمیشنز' },
      { en: 'Hand/foot and skin differences', ur: 'ہاتھ/پاؤں اور جلد کے فرق' },
    ],
    diagnosis: {
      en: 'Clinical features plus MRI; genetic testing for the PIK3CA change supports diagnosis and treatment.',
      ur: 'طبی خصوصیات کے ساتھ ایم آر آئی؛ PIK3CA تبدیلی کا جینیاتی ٹیسٹ تشخیص و علاج میں معاون ہے۔',
    },
    treatment: {
      en: 'Individualised multidisciplinary care: surgery, sclerotherapy, and emerging PIK3CA-targeted medicines.',
      ur: 'انفرادی کثیر‑ماہر علاج: سرجری، اسکلیروتھراپی، اور ابھرتی ہوئی PIK3CA‑ہدف ادویات۔',
    },
    whenToSeeDoctor: {
      en: 'Refer early to an experienced multidisciplinary centre for assessment and a coordinated plan.',
      ur: 'جانچ اور مربوط منصوبے کے لیے جلد کسی تجربہ کار کثیر‑ماہر مرکز کو ریفر کریں۔',
    },
    accent: '#5d7bff',
    hotspot: { x: 0.5, y: 0.45 },
  },
];

export function getCondition(slug: string): Condition | undefined {
  return CONDITIONS.find((c) => c.slug === slug);
}
