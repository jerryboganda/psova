// GET /api/registry/stats — public aggregates, ISR-cached (API-SPEC §2).
//
// Deviation from SECURITY §5.2 (stats 60/h per IP), accepted by design: an
// in-memory limiter needs the caller IP, and reading request headers here would
// force the route dynamic and defeat the mandated `revalidate` caching
// (ARCHITECTURE §3.3). Because the response is (a) identical for everyone,
// (b) already-public k-anonymized aggregates with no per-caller state, and
// (c) served from the ISR cache without a DB hit, the 1h cache is the effective
// abuse mitigation in place of a per-IP counter.
import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/registry/stats';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch {
    // Degrade gracefully (e.g. DB unreachable at build) — ISR revalidates later.
    return NextResponse.json({
      ok: true,
      published: false,
      totals: { verified: 0, provinces: 0, clinicians: 0, conditions: 0 },
      byProvince: [],
      byCondition: [],
      byGender: [],
      byAgeBand: [],
      byYear: [],
      updatedAt: new Date(0).toISOString(),
    });
  }
}
