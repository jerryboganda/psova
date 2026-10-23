// POST /api/centre/mdt/[id]/comments — comment on a post. Owner or doctor of any live centre.
import { addMdtComment } from '@/lib/registry/centre-mdt';
import { mdtCommentSchema } from '@/lib/registry/schemas';
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
    const parsed = mdtCommentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    await addMdtComment(center, id, parsed.data.body, { actorId: user.id, ip: getClientIp(req) });
    return apiOk(undefined, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
