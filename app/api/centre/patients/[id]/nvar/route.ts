// POST /api/centre/patients/[id]/nvar — opt one of the centre's patients into (or out of) the
// national registry. Owner or doctor. Until shared, NVAR admins, stats and exports cannot see the record.
import { updateNvarSharing } from '@/lib/registry/centre-sharing';
import { nvarShareSchema } from '@/lib/registry/schemas';
import {
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
    const parsed = nvarShareSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    await updateNvarSharing(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
