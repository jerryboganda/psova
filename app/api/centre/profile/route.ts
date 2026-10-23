// PATCH /api/centre/profile — owner edits the public profile fields.
import { updateCenterProfile } from '@/lib/registry/centers';
import { centerProfileSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER'], write: true });
    const parsed = centerProfileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await updateCenterProfile(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
