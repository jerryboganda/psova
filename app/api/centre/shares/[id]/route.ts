// PATCH /api/centre/shares/[id] — the receiving centre accepts / declines a referral or answers a
// second-opinion request. Owner or doctor.
import { respondToShare } from '@/lib/registry/centre-sharing';
import { shareRespondSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'], write: true });
    const parsed = shareRespondSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    const result = await respondToShare(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
