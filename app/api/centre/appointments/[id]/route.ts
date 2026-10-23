// PATCH /api/centre/appointments/[id] — mark done / missed / cancelled, or reschedule.
import { updateAppointment } from '@/lib/registry/centre-journey';
import { appointmentUpdateSchema } from '@/lib/registry/schemas';
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
    const parsed = appointmentUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    await updateAppointment(center, id, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
