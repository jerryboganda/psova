// POST /api/centre/patients/[id]/whatsapp — audit that staff opened WhatsApp for a patient.
// The wa.me link itself is built in the browser; nothing is sent from the server.
import { z } from 'zod';
import { logWhatsApp } from '@/lib/registry/centre-patients';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

const bodySchema = z.object({ template: z.enum(['trackingCode', 'appointment', 'missed']) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    await logWhatsApp(center, id, parsed.data.template, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
