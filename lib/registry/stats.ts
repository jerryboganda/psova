// Public statistics with k-anonymity (SECURITY §7). Only VERIFIED records feed
// stats; any bucket with count < 5 is suppressed to null (UI renders "<5");
// totals are exact. Dashboard is gated until VERIFIED ≥ STATS_PUBLISH_THRESHOLD.

import { prisma } from './db';
import { NVAR_VISIBLE } from './visibility';
import { AGE_BANDS, ageBandKey, K_ANON_MIN, STATS_PUBLISH_THRESHOLD } from './constants';

function suppress(count: number): number | null {
  return count < K_ANON_MIN ? null : count;
}

/**
 * Secondary suppression: when any cell in a dimension is hidden, hide one more
 * visible cell (the smallest) so the exact suppressed value cannot be recovered
 * by subtracting the visible cells from the exact total.
 */
function suppressDimension(counts: number[]): (number | null)[] {
  const out = counts.map(suppress);
  if (out.some((v) => v === null) && out.some((v) => v !== null)) {
    let smallest = -1;
    out.forEach((v, i) => {
      if (v !== null && (smallest === -1 || v < (out[smallest] as number))) smallest = i;
    });
    if (smallest >= 0) out[smallest] = null;
  }
  return out;
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
      where: { AND: [NVAR_VISIBLE, { status: 'VERIFIED' }] },
      select: { province: true, gender: true, birthYear: true, birthMonth: true, createdAt: true, clinicianId: true },
    }),
    prisma.registryDiagnosis.groupBy({
      by: ['conditionSlug'],
      where: { patient: { AND: [NVAR_VISIBLE, { status: 'VERIFIED' }] } },
      _count: { conditionSlug: true },
    }),
  ]);

  const total = rows.length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const provinceMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  const bandMap = new Map<string, number>();
  const yearMap = new Map<number, number>();
  const clinicianSet = new Set<string>();

  for (const r of rows) {
    provinceMap.set(r.province, (provinceMap.get(r.province) ?? 0) + 1);
    genderMap.set(r.gender, (genderMap.get(r.gender) ?? 0) + 1);
    const age = currentYear - r.birthYear - (currentMonth < r.birthMonth ? 1 : 0);
    const band = ageBandKey(Math.max(0, age));
    bandMap.set(band, (bandMap.get(band) ?? 0) + 1);
    const yr = r.createdAt.getFullYear();
    yearMap.set(yr, (yearMap.get(yr) ?? 0) + 1);
    if (r.clinicianId) clinicianSet.add(r.clinicianId);
  }

  const provinceEntries = [...provinceMap.entries()].sort((a, b) => b[1] - a[1]);
  const provinceCounts = suppressDimension(provinceEntries.map((e) => e[1]));
  const byProvince = provinceEntries.map(([province], i) => ({ province, count: provinceCounts[i] }));

  const conditionEntries = [...condGroups].sort((a, b) => b._count.conditionSlug - a._count.conditionSlug);
  const conditionCounts = suppressDimension(conditionEntries.map((g) => g._count.conditionSlug));
  const byCondition = conditionEntries.map((g, i) => ({ slug: g.conditionSlug, count: conditionCounts[i] }));

  const genderOrder = ['MALE', 'FEMALE', 'OTHER'];
  const genderEntries = genderOrder.filter((g) => genderMap.has(g));
  const genderCounts = suppressDimension(genderEntries.map((g) => genderMap.get(g)!));
  const byGender = genderEntries.map((gender, i) => ({ gender, count: genderCounts[i] }));

  const ageEntries = AGE_BANDS.filter((b) => bandMap.has(b.key));
  const ageCounts = suppressDimension(ageEntries.map((b) => bandMap.get(b.key)!));
  const byAgeBand = ageEntries.map((b, i) => ({ band: b.key, count: ageCounts[i] }));

  const yearEntries = [...yearMap.entries()].sort((a, b) => a[0] - b[0]);
  const yearCounts = suppressDimension(yearEntries.map((e) => e[1]));
  const byYear = yearEntries.map(([year], i) => ({ year, count: yearCounts[i] }));

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
