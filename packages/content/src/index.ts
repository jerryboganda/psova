import {
  careCenterSchema,
  conditionSchema,
  glossaryTermSchema,
  newsItemSchema,
} from '@psova/domain';
import { CARE_CENTERS, PROVINCES } from './centers';
import { CONDITIONS, getCondition } from './conditions';
import { GLOSSARY } from './glossary';
import { NEWS } from './news';

export const VALIDATED_CONDITIONS = CONDITIONS.map((item) => conditionSchema.parse(item));
export const VALIDATED_CENTERS = CARE_CENTERS.map((item) =>
  careCenterSchema.parse({
    ...item,
    phone: /X|PLACEHOLDER/i.test(item.phone) ? null : item.phone,
    verification: {
      status: 'unverified',
      verifiedAt: null,
      source: item.website ?? null,
      note: {
        en: 'Representative listing. Confirm details with the institution before travelling.',
        ur: 'نمائندہ اندراج۔ سفر سے پہلے ادارے سے تفصیلات کی تصدیق کریں۔',
      },
    },
  }),
);
export const VALIDATED_NEWS = NEWS.map((item) =>
  newsItemSchema.parse({ ...item, publicationStatus: 'draft' }),
);
export const VALIDATED_GLOSSARY = GLOSSARY.map((item) => glossaryTermSchema.parse(item));

export { CARE_CENTERS, CONDITIONS, GLOSSARY, NEWS, PROVINCES, getCondition };
export * from './conditions';
export * from './centers';
export * from './news';
export * from './glossary';
export * from './site';
export * from './donation';
export * from './navigation';
