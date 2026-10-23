// GET /api/centre/shares/[id]/documents/[docId] — a teaching-consented file attached to a second-opinion request.
import { readSharedDocument } from '@/lib/registry/centre-sharing';
import { documentResponse } from '@/lib/registry/document-response';
import { getClientIp, handleApiError, requireCenterMember } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'] });
    const { id, docId } = await params;
    return documentResponse(await readSharedDocument(center, id, docId, { actorId: user.id, ip: getClientIp(req) }));
  } catch (error) {
    return handleApiError(error);
  }
}
