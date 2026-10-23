// POST /api/centre/patients/[id]/shares — send a referral (identified, copy on accept) or a
// de-identified second-opinion request to another live centre. Owner or doctor.
import { sendShare } from '@/lib/registry/centre-sharing';
import { shareSendSchema } from '@/lib/registry/schemas';
import { RATE_LIMITS, limit } from '@/lib/registry/rate-limit';
import {
  RegistryApiError,
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'], write: true });
    const { max, windowMs } = RATE_LIMITS.centerStaff;
    if (!limit('centerStaff', user.id, max, windowMs)) throw new RegistryApiError(429, 'rate-limited');
    const parsed = shareSendSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    const shareId = await sendShare(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk({ id: shareId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
