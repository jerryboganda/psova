// GET /api/registry/stats — public aggregates, ISR-cached (API-SPEC §2).
// Cached (no per-request state) so k-anonymized aggregates are cheap and stable.
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
