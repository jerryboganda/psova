// POST /api/registry/status — tracking lookup (API-SPEC §2). Uniform 404 on any
// miss (either code or phone) to resist enumeration.

import { statusLookup } from '@/lib/registry/patients';
import { statusSchema } from '@/lib/registry/schemas';
import { checkLimit } from '@/lib/registry/rate-limit';
import {
  apiOk,
  apiError,
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

    const limited = checkLimit('status', ip);
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    const raw = await req.json().catch(() => null);
    const parsed = statusSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    const result = await statusLookup(parsed.data, { ip });
    if (!result) return apiError('not-found', 404);

    return apiOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
