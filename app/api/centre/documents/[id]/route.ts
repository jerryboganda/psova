// GET/DELETE /api/centre/documents/[id] — stream a decrypted document (audited) / remove it.
// Never cached. Images render inline; PDFs download, so no active content runs on our origin.
import { deleteDocument, readDocument } from '@/lib/registry/centre-documents';
import { documentResponse } from '@/lib/registry/document-response';
import {
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR', 'NURSE'] });
    const { id } = await params;
    const doc = await readDocument(center, id, { actorId: user.id, ip: getClientIp(req) });
    return documentResponse(doc);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR'], write: true });
    const { id } = await params;
    await deleteDocument(center, id, { actorId: user.id, ip: getClientIp(req) });
    return apiOk();
  } catch (error) {
    return handleApiError(error);
  }
}
