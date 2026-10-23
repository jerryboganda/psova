import { z } from 'zod';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'https://psova.org.pk';

/** Appointment times are shown in Pakistan time whatever the phone's own zone. */
export const CENTRE_TIME_ZONE = 'Asia/Karachi';

const statusSchema = z.object({
  ok: z.literal(true),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'CENTRE']),
  submittedAt: z.string(),
  firstName: z.string(),
  publicReason: z.string().optional(),
  centre: z.object({ en: z.string(), ur: z.string() }).optional(),
  nextAppointment: z.object({ startsAt: z.string(), kind: z.enum(['FIRST_VISIT', 'FOLLOW_UP', 'PROCEDURE']) }).optional(),
});
export type RegistrationStatus = z.infer<typeof statusSchema>;

export type StatusLookup =
  | { kind: 'found'; result: RegistrationStatus }
  | { kind: 'notfound' }
  | { kind: 'failed' };

/**
 * Same lookup as the website's status page: tracking code + the phone number it was registered with.
 * Nothing is stored on the device. The API is same-origin when the app is served from psova.org.pk/app.
 */
export async function lookupStatus(trackingCode: string, phone: string): Promise<StatusLookup> {
  try {
    const response = await fetch(`${API_BASE}/api/registry/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ trackingCode, phone }),
    });
    if (response.status === 404) return { kind: 'notfound' };
    const parsed = statusSchema.safeParse(await response.json().catch(() => null));
    if (!response.ok || !parsed.success) return { kind: 'failed' };
    return { kind: 'found', result: parsed.data };
  } catch {
    return { kind: 'failed' };
  }
}

/** Full URL of a website page for the current language, used by the "More" links. */
export function siteUrl(locale: 'en' | 'ur', path: string): string {
  return `${API_BASE}/${locale}${path}`;
}
