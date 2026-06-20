import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conditional logic, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick a localized string from a { en, ur } record. */
export function localized(
  value: { en: string; ur: string } | string,
  locale: string,
): string {
  if (typeof value === 'string') return value;
  return locale === 'ur' ? value.ur : value.en;
}
