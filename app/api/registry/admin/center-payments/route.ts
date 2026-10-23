// GET /api/registry/admin/center-payments — membership payments to verify.
import { NextResponse } from 'next/server';
import { listCenterPayments } from '@/lib/registry/centers';
import { adminCenterPaymentsQuerySchema } from '@/lib/registry/schemas';
import { apiError, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req.headers);
    const parsed = adminCenterPaymentsQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return apiError('validation', 400);
    return NextResponse.json({ ok: true, ...(await listCenterPayments(parsed.data)) });
  } catch (error) {
    return handleApiError(error);
  }
}
