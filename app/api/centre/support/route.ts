// POST /api/centre/support — a centre asks PSOVA to raise funds for one patient's treatment. Owner or doctor.
import { createSupportRequest } from '@/lib/registry/support-fund';
import { supportRequestCreateSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'], write: true });
    const parsed = supportRequestCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const id = await createSupportRequest(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk({ id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
