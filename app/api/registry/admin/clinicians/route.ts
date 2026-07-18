// GET /api/registry/admin/clinicians — list (decrypted PMC no.) (API-SPEC §4).
import { NextResponse } from 'next/server';
import { listClinicians } from '@/lib/registry/patients';
import { adminCliniciansQuerySchema } from '@/lib/registry/schemas';
import { apiError, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req.headers);
    const url = new URL(req.url);
    const parsed = adminCliniciansQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return apiError('validation', 400);
    const result = await listClinicians(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
