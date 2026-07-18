// PATCH /api/registry/admin/clinicians/[id] — approve/reject (API-SPEC §4).
import { setClinicianApproval } from '@/lib/registry/patients';
import { clinicianActionSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const raw = await req.json().catch(() => null);
    const parsed = clinicianActionSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);
    await setClinicianApproval(id, parsed.data, { adminId: admin.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
