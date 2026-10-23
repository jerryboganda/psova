// GET/POST /api/centre/staff — owner-only: list staff, invite a new member.
import { NextResponse } from 'next/server';
import { inviteStaff, listStaff } from '@/lib/registry/centers';
import { staffInviteSchema } from '@/lib/registry/schemas';
import { limit } from '@/lib/registry/rate-limit';
import { RATE_LIMITS } from '@/lib/registry/rate-limit';
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

export async function GET(req: Request) {
  try {
    const { center } = await requireCenterMember(req.headers, { roles: ['OWNER'] });
    return NextResponse.json({ ok: true, items: await listStaff(center.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    const { user, center } = await requireCenterMember(req.headers, { roles: ['OWNER'], write: true });
    const { max, windowMs } = RATE_LIMITS.centerStaff;
    if (!limit('centerStaff', user.id, max, windowMs)) throw new RegistryApiError(429, 'rate-limited');
    const parsed = staffInviteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return apiError('validation', 400);
    await inviteStaff(center, parsed.data, { actorId: user.id, ip: getClientIp(req) });
    return apiOk(undefined, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
