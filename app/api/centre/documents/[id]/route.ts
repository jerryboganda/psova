// GET/DELETE /api/centre/documents/[id] — stream a decrypted document (audited) / remove it.
// Never cached. Images render inline; PDFs download, so no active content runs on our origin.
import { deleteDocument, readDocument } from '@/lib/registry/centre-documents';
import {
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

const asciiFallback = (name: string) => name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER', 'DOCTOR', 'NURSE'] });
    const { id } = await params;
    const doc = await readDocument(center, id, { actorId: user.id, ip: getClientIp(req) });
    const inline = doc.mime.startsWith('image/');
    return new Response(new Uint8Array(doc.bytes), {
      headers: {
        'Content-Type': doc.mime,
        'Content-Length': String(doc.bytes.length),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asciiFallback(doc.fileName)}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        'Cache-Control': 'private, no-store',
      },
    });
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
