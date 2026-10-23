// PATCH /api/registry/admin/centres/[id] — approve / reject / suspend / reinstate /
// set tier / extend membership.
import { setCenterAction } from '@/lib/registry/centers';
import { centerActionSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const parsed = centerActionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await setCenterAction(id, parsed.data, { adminId: admin.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
