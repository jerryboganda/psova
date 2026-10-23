// GET /api/centre/mdt/[id]/documents/[docId] — a file attached to a visible board post.
import { readMdtDocument } from '@/lib/registry/centre-mdt';
import { documentResponse } from '@/lib/registry/document-response';
import { getClientIp, handleApiError, requireCenterMember } from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'] });
    const { id, docId } = await params;
    return documentResponse(await readMdtDocument(center, id, docId, { actorId: user.id, ip: getClientIp(req) }));
  } catch (error) {
    return handleApiError(error);
  }
}
