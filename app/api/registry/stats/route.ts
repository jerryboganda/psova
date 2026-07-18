// GET /api/registry/stats — public aggregates, ISR-cached (API-SPEC §2).
// Cached (no per-request state) so k-anonymized aggregates are cheap and stable.
import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/registry/stats';
import { handleApiError } from '@/lib/registry/guards';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    return handleApiError(error);
  }
}
