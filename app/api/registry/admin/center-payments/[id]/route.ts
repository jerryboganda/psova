// PATCH /api/registry/admin/center-payments/[id] — verify (extends membership by
// one year) or reject a manual membership payment.
import { setCenterPaymentAction } from '@/lib/registry/centers';
import { centerPaymentActionSchema } from '@/lib/registry/schemas';
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
    const parsed = centerPaymentActionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await setCenterPaymentAction(id, parsed.data, { adminId: admin.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
