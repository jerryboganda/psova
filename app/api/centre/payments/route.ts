// POST /api/centre/payments — owner submits renewal payment proof. Deliberately
// not write-guarded: an expired centre must still be able to renew.
import { submitCenterPayment } from '@/lib/registry/centers';
import { centerPaymentProofSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterApplicant,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterApplicant(req.headers, { roles: ['OWNER'] });
    const parsed = centerPaymentProofSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await submitCenterPayment(center.id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk(undefined, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
