// Public statistics with k-anonymity (SECURITY §7). Only VERIFIED records feed
// stats; any bucket with count < 5 is suppressed to null (UI renders "<5");
// totals are exact. Dashboard is gated until VERIFIED ≥ STATS_PUBLISH_THRESHOLD.

import { prisma } from './db';
import { AGE_BANDS, ageBandKey, K_ANON_MIN, STATS_PUBLISH_THRESHOLD } from './constants';

function suppress(count: number): number | null {
  return count < K_ANON_MIN ? null : count;
}

export type PublicStats = {
  published: boolean;
  totals: { verified: number; provinces: number; clinicians: number; conditions: number };
  byProvince: { province: string; count: number | null }[];
  byCondition: { slug: string; count: number | null }[];
  byGender: { gender: string; count: number | null }[];
  byAgeBand: { band: string; count: number | null }[];
  byYear: { year: number; count: number | null }[];
  updatedAt: string;
};

export async function getPublicStats(): Promise<PublicStats> {
  const [rows, condGroups] = await Promise.all([
    prisma.registryPatient.findMany({
      where: { status: 'VERIFIED' },
      select: { province: true, gender: true, birthYear: true, createdAt: true, clinicianId: true },
    }),
    prisma.registryDiagnosis.groupBy({
      by: ['conditionSlug'],
      where: { patient: { status: 'VERIFIED' } },
      _count: { conditionSlug: true },
    }),
  ]);

  const total = rows.length;
  const currentYear = new Date().getFullYear();

  const provinceMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  const bandMap = new Map<string, number>();
  const yearMap = new Map<number, number>();
  const clinicianSet = new Set<string>();

  for (const r of rows) {
    provinceMap.set(r.province, (provinceMap.get(r.province) ?? 0) + 1);
    genderMap.set(r.gender, (genderMap.get(r.gender) ?? 0) + 1);
    const band = ageBandKey(Math.max(0, currentYear - r.birthYear));
    bandMap.set(band, (bandMap.get(band) ?? 0) + 1);
    const yr = r.createdAt.getFullYear();
    yearMap.set(yr, (yearMap.get(yr) ?? 0) + 1);
    if (r.clinicianId) clinicianSet.add(r.clinicianId);
  }

  const byProvince = [...provinceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([province, c]) => ({ province, count: suppress(c) }));

  const byCondition = [...condGroups]
    .sort((a, b) => b._count.conditionSlug - a._count.conditionSlug)
    .map((g) => ({ slug: g.conditionSlug, count: suppress(g._count.conditionSlug) }));

  const genderOrder = ['MALE', 'FEMALE', 'OTHER'];
  const byGender = genderOrder
    .filter((g) => genderMap.has(g))
    .map((g) => ({ gender: g, count: suppress(genderMap.get(g)!) }));

  const byAgeBand = AGE_BANDS.filter((b) => bandMap.has(b.key)).map((b) => ({
    band: b.key,
    count: suppress(bandMap.get(b.key)!),
  }));

  const byYear = [...yearMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, c]) => ({ year, count: suppress(c) }));

  return {
    published: total >= STATS_PUBLISH_THRESHOLD,
    totals: {
      verified: total,
      provinces: provinceMap.size,
      clinicians: clinicianSet.size,
      conditions: condGroups.length,
    },
    byProvince,
    byCondition,
    byGender,
    byAgeBand,
    byYear,
    updatedAt: new Date().toISOString(),
  };
}
