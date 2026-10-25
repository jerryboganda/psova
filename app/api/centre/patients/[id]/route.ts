// PATCH /api/centre/patients/[id] — correct contact details and record consent.
import { updateCentrePatient } from '@/lib/registry/centre-patients';
import { centrePatientUpdateSchema } from '@/lib/registry/schemas';
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
    const { user, center } = await requireCenterMember(req.headers, { write: true });
    const { id } = await params;
    const parsed = centrePatientUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await updateCentrePatient(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
