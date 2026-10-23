// POST /api/centre/appointments — book an appointment for one of the centre's patients (any staff role).
import { createAppointment } from '@/lib/registry/centre-journey';
import { appointmentCreateSchema } from '@/lib/registry/schemas';
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
    const parsed = appointmentCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const id = await createAppointment(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk({ id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
