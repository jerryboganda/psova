import { SITE } from '@/data/site';

/** Strip a phone string down to digits only (drops +, spaces, dashes). */
export function phoneDigits(phone: string = SITE.phone): string {
  return phone.replace(/[^\d]/g, '');
}

/** A `tel:` href in E.164-ish form, e.g. `tel:+923214261950`. */
export function telHref(phone: string = SITE.phone): string {
  return `tel:+${phoneDigits(phone)}`;
}

/** A wa.me click-to-chat link, with an optional prefilled message. */
export function whatsappHref(text?: string, phone: string = SITE.phone): string {
  const base = `https://wa.me/${phoneDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
