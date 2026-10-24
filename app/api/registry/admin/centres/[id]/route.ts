// GET /api/registry/admin/centres/[id] — full centre detail (decrypted PMC; audited).
// PATCH — lifecycle action (approve/reject/suspend/reinstate/tier/extend) OR a
//         direct admin edit of the centre's profile and status.
// DELETE — remove an empty centre; centres with linked records must be suspended.
import { getCenterAdminDetail, deleteCenterByAdmin, setCenterAction, updateCenterByAdmin } from '@/lib/registry/centers';
import { adminCenterPatchSchema } from '@/lib/registry/schemas';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const detail = await getCenterAdminDetail(id);
    if (!detail) return apiError('not-found', 404);

    await writeAudit({
      actorId: admin.id,
      actorRole: 'admin',
      action: AuditAction.RECORD_VIEW_PII,
      entity: 'Center',
      entityId: id,
      meta: { view: 'admin-centre-detail' },
      ip: getClientIp(req),
    });
    return apiOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const parsed = adminCenterPatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    if (parsed.data.action === 'UPDATE') {
      await updateCenterByAdmin(id, parsed.data, { adminId: admin.id, ip: getClientIp(req) });
    } else {
      await setCenterAction(id, parsed.data, { adminId: admin.id, ip: getClientIp(req) });
    }
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    await deleteCenterByAdmin(id, { adminId: admin.id, ip: getClientIp(req) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
