// "Send on WhatsApp" without the API: staff click a wa.me link, WhatsApp Web opens with the
// message prefilled, and they press send themselves. Pure — safe for client components.

import { isValidPkMobile, normalizePhone } from './normalize';

/** wa.me link for a Pakistani mobile (03XX…, +92…, 92…), or null when the number is not one. */
export function waLink(phone: string, text: string): string | null {
  if (!isValidPkMobile(phone)) return null;
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}
