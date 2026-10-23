// GET /api/registry/admin/centres — centres queue (decrypted head-doctor PMC no.,
// so the view is audited like the clinicians list).
import { NextResponse } from 'next/server';
import { listCenters } from '@/lib/registry/centers';
import { adminCentersQuerySchema } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import { apiError, getClientIp, handleApiError, requireAdmin } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req.headers);
    const parsed = adminCentersQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return apiError('validation', 400);
    const result = await listCenters(parsed.data);

    await writeAudit({
      actorId: admin.id,
      actorRole: 'admin',
      action: AuditAction.RECORD_VIEW_PII,
      entity: 'Center',
      meta: { count: result.items.length, page: parsed.data.page, status: parsed.data.status },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
