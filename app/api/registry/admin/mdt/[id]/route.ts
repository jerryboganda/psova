// PATCH /api/registry/admin/mdt/[id] — PSOVA moderation: hide / unhide a board post or comment.
import { z } from 'zod';
import { moderateMdt } from '@/lib/registry/centre-mdt';
import { adminMdtActionSchema } from '@/lib/registry/schemas';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireAdmin,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

const bodySchema = adminMdtActionSchema.extend({ kind: z.enum(['post', 'comment']) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const admin = await requireAdmin(req.headers);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    const { id } = await params;
    await moderateMdt({ kind: parsed.data.kind, id }, parsed.data.action, { actorId: admin.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
