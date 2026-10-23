// POST /api/centre/patients — centre staff add a patient (any staff role; membership must allow writes).
import { addCentrePatient } from '@/lib/registry/centre-patients';
import { caseSchema } from '@/lib/registry/schemas';
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
    const { user, center } = await requireCenterMember(req.headers, { write: true });
    const parsed = caseSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const result = await addCentrePatient(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk({ trackingCode: result.trackingCode, patientId: result.patientId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
