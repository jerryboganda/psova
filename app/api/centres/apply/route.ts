// POST /api/centres/apply — a clinic/hospital applies to join the PSOVA centres
// network. Flow mirrors clinicians/register: origin → honeypot → rate-limit →
// validate → create owner user + Center(APPLIED) (+ optional payment proof) → audit.

import { applyCenter } from '@/lib/registry/centers';
import { centerApplySchema } from '@/lib/registry/schemas';
import { checkLimit } from '@/lib/registry/rate-limit';
import {
  apiError,
  apiOk,
  getClientIp,
  handleApiError,
  rateLimitedResponse,
  verifyOrigin,
} from '@/lib/registry/guards';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const ip = getClientIp(req) ?? 'unknown';
    const raw = await req.json().catch(() => null);

    // Honeypot: indistinguishable fake success (SECURITY §5.3).
    if (raw && typeof raw === 'object' && typeof raw.website === 'string' && raw.website.length > 0) {
      return apiOk(undefined, { status: 201 });
    }

    const limited = checkLimit('centerApply', ip);
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    const parsed = centerApplySchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    await applyCenter(parsed.data, { headers: req.headers, ip });
    return apiOk(undefined, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
