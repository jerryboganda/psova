// POST /api/registry/enroll — patient self-enrollment (API-SPEC §2, SECURITY §5).
// origin → size(413) → honeypot(fake 201) → rate-limit(5/h) → validate → create.

import { createEnrollment } from '@/lib/registry/patients';
import { enrollSchema } from '@/lib/registry/schemas';
import { checkLimit } from '@/lib/registry/rate-limit';
import { generateTrackingCode } from '@/lib/registry/codes';
import { writeAudit } from '@/lib/registry/audit';
import { AuditAction } from '@/lib/registry/constants';
import {
  apiOk,
  apiError,
  getClientIp,
  handleApiError,
  rateLimitedResponse,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

const MAX_BODY = 50 * 1024; // 50 KB

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const ip = getClientIp(req) ?? 'unknown';

    const contentLength = req.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY) {
      return apiError('payload-too-large', 413);
    }
    const rawText = await req.text();
    if (rawText.length > MAX_BODY) return apiError('payload-too-large', 413);

    let raw: unknown = null;
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = null;
    }

    // Honeypot: filled → silently drop, return a fake success (no record written).
    if (
      raw &&
      typeof raw === 'object' &&
      typeof (raw as Record<string, unknown>).website === 'string' &&
      (raw as Record<string, unknown>).website !== ''
    ) {
      await writeAudit({
        actorRole: 'public',
        action: AuditAction.ENROLL_SUBMIT,
        entity: 'RegistryPatient',
        meta: { honeypot: true },
        ip,
      });
      return apiOk({ trackingCode: generateTrackingCode() }, { status: 201 });
    }

    const limited = checkLimit('enroll', ip);
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    const parsed = enrollSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    const { trackingCode } = await createEnrollment(parsed.data, { ip });
    return apiOk({ trackingCode }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
