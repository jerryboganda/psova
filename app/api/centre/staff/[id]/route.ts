// PATCH /api/centre/staff/[id] — owner-only: change role, (de)activate, resend invite.
import { updateStaff } from '@/lib/registry/centers';
import { staffUpdateSchema } from '@/lib/registry/schemas';
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER'], write: true });
    const { max, windowMs } = RATE_LIMITS.centerStaff;
    if (!limit('centerStaff', user.id, max, windowMs)) throw new RegistryApiError(429, 'rate-limited');
    const { id } = await params;
    const parsed = staffUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await updateStaff(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
