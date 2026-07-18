// GET (decrypted detail + duplicates, audited) / PATCH (verify/reject/duplicate/
// update) a record (API-SPEC §4).
import { getAdminRecordDetail, applyAdminAction } from '@/lib/registry/patients';
import { adminActionSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const detail = await getAdminRecordDetail(id, { actorId: admin.id, ip: getClientIp(req) });
    if (!detail) return apiError('not-found', 404);
    return apiOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const { id } = await params;
    const raw = await req.json().catch(() => null);
    const parsed = adminActionSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);
    const result = await applyAdminAction(id, parsed.data, {
      adminId: admin.id,
      ip: getClientIp(req),
    });
    return apiOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
