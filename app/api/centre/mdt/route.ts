// POST /api/centre/mdt — post a de-identified case to the discussion board. Owner or doctor.
import { createMdtPost } from '@/lib/registry/centre-mdt';
import { mdtPostCreateSchema } from '@/lib/registry/schemas';
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
    const parsed = mdtPostCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const id = await createMdtPost(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk({ id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
