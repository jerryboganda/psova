// PATCH /api/registry/admin/centres/[id]/staff/[memberId] — change role, activate
// or deactivate, or resend the setup link.
// DELETE — remove the member from the centre.
import { removeCenterStaffByAdmin, updateCenterStaffByAdmin } from '@/lib/registry/centers';
import { adminCenterStaffUpdateSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id, memberId } = await params;
    const parsed = adminCenterStaffUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await updateCenterStaffByAdmin(id, memberId, parsed.data, {
      adminId: admin.id,
      ip: getClientIp(req),
    });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id, memberId } = await params;
    await removeCenterStaffByAdmin(id, memberId, { adminId: admin.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
