import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // English + Urdu, both shipped from day one.
  locales: ['en', 'ur'],
  defaultLocale: 'en',
  // Always prefix so /en and /ur are explicit and shareable.
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

// Locales that render right-to-left.
export const RTL_LOCALES: Locale[] = ['ur'];

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr';
}
