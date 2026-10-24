// POST /api/registry/admin/centres/[id]/staff — add a staff member to any centre.
// If the email already has an account it is attached; otherwise an account is
// created and a password-setup link is emailed.
import { addCenterStaffByAdmin } from '@/lib/registry/centers';
import { adminCenterStaffCreateSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const parsed = adminCenterStaffCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const result = await addCenterStaffByAdmin(id, parsed.data, {
      adminId: admin.id,
      ip: getClientIp(req),
    });
    return apiOk(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
