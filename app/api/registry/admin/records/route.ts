// GET /api/registry/admin/records — metadata list + search (API-SPEC §4).
import { NextResponse } from 'next/server';
import { listRecords } from '@/lib/registry/patients';
import { adminRecordsQuerySchema } from '@/lib/registry/schemas';
import { apiError, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req.headers);
    const url = new URL(req.url);
    const parsed = adminRecordsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError('validation', 400);
    const result = await listRecords(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
