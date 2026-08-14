const ALLOWED_SCHEMES = new Set(['https:', 'tel:', 'mailto:', 'geo:', 'psova:']);
const ALLOWED_HTTPS_HOSTS = new Set([
  'wa.me',
  'www.google.com',
  'maps.google.com',
  'psova.org.pk',
  'www.psova.org.pk',
  'psova.polytronx.com',
  'hospitals.aku.edu',
]);

export function phoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function telHref(phone: string): string {
  const digits = phoneDigits(phone);
  if (digits.length < 6 || digits.length > 15) throw new Error('Invalid phone number');
  return `tel:+${digits}`;
}

export function whatsappHref(phone: string, text?: string): string {
  const digits = phoneDigits(phone);
  if (digits.length < 6 || digits.length > 15) throw new Error('Invalid WhatsApp number');
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function directionsHref(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Invalid map coordinate');
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function assertAllowedExternalUrl(raw: string): string {
  const url = new URL(raw);
  if (!ALLOWED_SCHEMES.has(url.protocol)) throw new Error('URL scheme is not allowed');
  if (url.protocol === 'https:' && !ALLOWED_HTTPS_HOSTS.has(url.hostname) && !url.hostname.endsWith('.edu.pk') && !url.hostname.endsWith('.org.pk')) {
    throw new Error('HTTPS host is not allowed');
  }
  return url.toString();
}

export function parsePsovaDeepLink(raw: string): { route: 'news' | 'condition' | 'directory'; id?: string } {
  const url = new URL(raw);
  if (url.protocol !== 'psova:') throw new Error('Not a PSOVA deep link');
  const route = (url.hostname || url.pathname.split('/').filter(Boolean)[0]) as 'news' | 'condition' | 'directory';
  if (!['news', 'condition', 'directory'].includes(route)) throw new Error('Unsupported PSOVA route');
  const id = url.pathname.split('/').filter(Boolean).at(-1);
  return { route, id: id === route ? undefined : id };
}
