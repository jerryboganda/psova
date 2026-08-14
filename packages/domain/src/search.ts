import type { Locale, LocalizedString } from './schemas';

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ی')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function localizedValue(value: LocalizedString, locale: Locale): string {
  return value[locale];
}

export function matchesSearch(query: string, fields: string[]): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  const tokens = needle.split(' ');
  const haystack = normalizeSearch(fields.join(' '));
  return tokens.every((token) => haystack.includes(token));
}
