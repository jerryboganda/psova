// POST /api/centres/intake/[slug] — a patient registers through a centre's QR code / link.
// Public (no account). Flow mirrors /api/registry/enroll: origin → honeypot → rate-limit →
// validate → create a centre-owned record → tracking code.

import { generateTrackingCode } from '@/lib/registry/codes';
import { registerViaIntake } from '@/lib/registry/centre-patients';
import { getListedCenterBySlug } from '@/lib/registry/directory';
import { centreIntakeSchema } from '@/lib/registry/schemas';
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

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    verifyOrigin(req);
    const ip = getClientIp(req) ?? 'unknown';
    const raw = await req.json().catch(() => null);

    // Honeypot: indistinguishable fake success (SECURITY §5.3).
    if (raw && typeof raw === 'object' && typeof raw.website === 'string' && raw.website.length > 0) {
      return apiOk({ trackingCode: generateTrackingCode() }, { status: 201 });
    }

    const limited = checkLimit('centreIntake', ip);
    if (!limited.ok) return rateLimitedResponse(limited.retryAfter);

    // Only centres that are live (approved, membership active or in grace) take registrations.
    const { slug } = await params;
    const center = await getListedCenterBySlug(slug);
    if (!center) return apiError('not-found', 404);

    const parsed = centreIntakeSchema.safeParse(raw);
    if (!parsed.success) return apiError('validation', 400);

    const { trackingCode } = await registerViaIntake(center, parsed.data, { ip });
    return apiOk({ trackingCode }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
