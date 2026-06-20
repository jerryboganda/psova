import type { LocalizedString } from './conditions';

export type GlossaryTerm = { term: LocalizedString; def: LocalizedString };

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: { en: 'Hemangioma', ur: 'ہیمانجیوما' },
    def: {
      en: 'A common benign vascular tumour of infancy that grows then shrinks over time.',
      ur: 'بچپن کا ایک عام بے ضرر ویسکولر ٹیومر جو پہلے بڑھتا پھر وقت کے ساتھ سکڑتا ہے۔',
    },
  },
  {
    term: { en: 'Vascular malformation', ur: 'ویسکولر میل‑فارمیشن' },
    def: {
      en: 'Blood or lymph vessels that formed incorrectly; usually present from birth and persistent.',
      ur: 'خون یا لمف کی نالیاں جو غلط بنیں؛ عام طور پر پیدائش سے موجود اور مستقل۔',
    },
  },
  {
    term: { en: 'Sclerotherapy', ur: 'اسکلیروتھراپی' },
    def: {
      en: 'An injection that shrinks abnormal veins or lymphatic cysts from the inside.',
      ur: 'ایک انجیکشن جو غیر معمولی رگوں یا لمفی سسٹ کو اندر سے سکیڑتا ہے۔',
    },
  },
  {
    term: { en: 'Embolization', ur: 'ایمبولائزیشن' },
    def: {
      en: 'Blocking abnormal vessels from inside using a catheter — key for high-flow AVMs.',
      ur: 'کیتھیٹر کے ذریعے غیر معمولی نالیوں کو اندر سے بند کرنا — تیز‑بہاؤ اے‑وی‑ایم کے لیے اہم۔',
    },
  },
  {
    term: { en: 'Propranolol', ur: 'پروپرانولول' },
    def: {
      en: 'The first-line medicine for problematic infantile hemangiomas.',
      ur: 'مسئلہ پیدا کرنے والے بچپن کے ہیمانجیوما کی پہلی ترجیحی دوا۔',
    },
  },
  {
    term: { en: 'Multidisciplinary team', ur: 'کثیر‑ماہر ٹیم' },
    def: {
      en: 'Several specialists working together — the gold standard for complex anomalies.',
      ur: 'کئی ماہرین کا مل کر کام کرنا — پیچیدہ ایناملیز کے لیے بہترین معیار۔',
    },
  },
];
