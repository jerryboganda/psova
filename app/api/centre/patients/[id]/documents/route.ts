// POST /api/centre/patients/[id]/documents — upload a clinical photo/report (multipart:
// file, kind, consentForTeaching). Owner, doctor or nurse; membership must allow writes.
import { uploadDocument } from '@/lib/registry/centre-documents';
import { documentUploadSchema } from '@/lib/registry/schemas';
import { MAX_UPLOAD_BYTES } from '@/lib/registry/storage';
import { RATE_LIMITS, limit } from '@/lib/registry/rate-limit';
import {
  RegistryApiError,
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  requireCenterMember,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, {
      roles: ['OWNER', 'DOCTOR', 'NURSE'],
      write: true,
    });
    const { max, windowMs } = RATE_LIMITS.centreUpload;
    if (!limit('centreUpload', user.id, max, windowMs)) throw new RegistryApiError(429, 'rate-limited');

    // Reject oversized bodies before buffering them (the multipart envelope adds a little).
    const declared = Number(req.headers.get('content-length') ?? 0);
    if (declared > MAX_UPLOAD_BYTES + 512 * 1024) return apiError('payload-too-large', 413);

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!form || !(file instanceof File)) return apiError('validation', 400);
    const meta = documentUploadSchema.safeParse({
      kind: form.get('kind'),
      consentForTeaching: form.get('consentForTeaching') === 'true',
    });
    if (!meta.success) return apiError('validation', 400);

    const { id } = await params;
    const documentId = await uploadDocument(
      center,
      id,
      { bytes: Buffer.from(await file.arrayBuffer()), name: file.name },
      meta.data,
      { actorId: user.id, ip: getClientIp(req) },
    );
    return apiOk({ id: documentId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
