// POST /api/centre/patients/[id]/visits — record a visit (doctor, nurse, owner). Nurses cannot
// record a plan or treatment; createEncounter enforces that as well.
import { createEncounter } from '@/lib/registry/centre-journey';
import { encounterCreateSchema } from '@/lib/registry/schemas';
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
    const { user, center, member } = await requireCenterMember(req.headers, {
      roles: ['OWNER', 'DOCTOR', 'NURSE'],
      write: true,
    });
    const parsed = encounterCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    const result = await createEncounter(center, id, parsed.data, {
      actorId: user.id,
      role: member.role,
      ip: getClientIp(req),
    });
    return apiOk(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
