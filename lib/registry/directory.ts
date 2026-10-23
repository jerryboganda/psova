// Registered centres → public directory (docs/centres/PLAN.md). Server-only.
// Only APPROVED centres whose membership is live or in grace are listed — the
// same rule as isPubliclyListed() in membership.ts, expressed as a DB filter.

import 'server-only';
import type { Center } from '@prisma/client';
import { CARE_CENTERS, PROVINCES, type CareCenter } from '@/data/centers';
import en from '@/messages/en.json';
import ur from '@/messages/ur.json';
import { prisma } from './db';
import { MEMBERSHIP_GRACE_DAYS } from './constants';
import { addDays } from './membership';

const PROVINCE_NAME: Record<string, string> = {
  PUNJAB: 'Punjab',
  SINDH: 'Sindh',
  KHYBER_PAKHTUNKHWA: 'Khyber Pakhtunkhwa',
  BALOCHISTAN: 'Balochistan',
  GILGIT_BALTISTAN: 'Gilgit-Baltistan',
  AZAD_JAMMU_KASHMIR: 'Azad Jammu & Kashmir',
  ISLAMABAD_CAPITAL_TERRITORY: 'Federal Capital',
};

// Fallback map position when a centre has no coordinates and its city is not in the static list.
const PROVINCE_CENTROID: Record<string, { lat: number; lng: number }> = {
  PUNJAB: { lat: 31.2, lng: 72.7 },
  SINDH: { lat: 26.0, lng: 68.5 },
  KHYBER_PAKHTUNKHWA: { lat: 34.0, lng: 71.5 },
  BALOCHISTAN: { lat: 28.5, lng: 65.5 },
  GILGIT_BALTISTAN: { lat: 35.9, lng: 74.3 },
  AZAD_JAMMU_KASHMIR: { lat: 33.9, lng: 73.8 },
  ISLAMABAD_CAPITAL_TERRITORY: { lat: 33.7, lng: 73.05 },
};

const clamp = (n: number) => Math.min(0.95, Math.max(0.05, n));
// Linear fit of the static list's geo → pos pairs (the map is a stylised outline).
const toPos = (lat: number, lng: number) => ({
  x: clamp(0.0591 * lng - 3.6726),
  y: clamp(-0.0673 * lat + 2.6067),
});

type ServiceLabels = Record<string, string>;
const SERVICES_EN = en.Centres.services as ServiceLabels;
const SERVICES_UR = ur.Centres.services as ServiceLabels;

export function toCareCenter(c: Center): CareCenter {
  const sameCity = CARE_CENTERS.find((s) => s.city.en.toLowerCase() === c.city.toLowerCase());
  const geo =
    c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : (sameCity?.geo ?? PROVINCE_CENTROID[c.province]);
  const province = PROVINCES.find((p) => p.en === PROVINCE_NAME[c.province]) ?? {
    en: PROVINCE_NAME[c.province],
    ur: PROVINCE_NAME[c.province],
  };
  const services = (c.services as string[]).map((k) => ({ en: SERVICES_EN[k] ?? k, ur: SERVICES_UR[k] ?? k }));

  return {
    id: c.slug,
    name: { en: c.nameEn, ur: c.nameUr || c.nameEn },
    city: sameCity?.city ?? { en: c.city, ur: c.city },
    province,
    type: c.type.toLowerCase() as CareCenter['type'],
    services,
    conditions: c.conditions as string[],
    phone: c.phone,
    website: c.website ?? undefined,
    geo,
    pos: toPos(geo.lat, geo.lng),
    flagship: c.tier === 'EXCELLENCE',
    registered: { slug: c.slug, tier: c.tier },
  };
}

const TTL_MS = 60_000;
let cache: { at: number; rows: Center[] } | undefined;

/** Listed centres, cached for a minute. A DB failure degrades to "none" so public pages still render. */
export async function getListedCenters(): Promise<Center[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  try {
    const rows = await prisma.center.findMany({
      where: {
        status: 'APPROVED',
        membershipExpiresAt: { gte: addDays(new Date(), -MEMBERSHIP_GRACE_DAYS) },
      },
      orderBy: [{ tier: 'desc' }, { nameEn: 'asc' }],
    });
    cache = { at: Date.now(), rows };
    return rows;
  } catch (error) {
    console.error('[centres directory] listing failed', error instanceof Error ? error.message : error);
    return cache?.rows ?? [];
  }
}

export async function getRegisteredCareCenters(): Promise<CareCenter[]> {
  return (await getListedCenters()).map(toCareCenter);
}

/** A single publicly listed centre by slug, or null. */
export async function getListedCenterBySlug(slug: string): Promise<Center | null> {
  return (await getListedCenters()).find((c) => c.slug === slug) ?? null;
}
