import { pushRegistrationSchema } from '@psova/domain';
import { hasDurableKv, serverEnv } from '@/lib/server/env';
import { registerInstallation, unregisterInstallation } from '@/lib/server/push';
import { clientIdentity, rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!hasDurableKv(serverEnv())) return Response.json({ ok: false, error: 'Push storage is not configured.' }, { status: 503 });
  const limit = await rateLimit({ scope: 'push-register', identity: clientIdentity(request), limit: 20, windowSeconds: 3600 });
  if (!limit.allowed) return Response.json({ ok: false, error: 'Too many requests.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
  const parsed = pushRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: 'Invalid registration.' }, { status: 400 });
  const installationId = await registerInstallation(parsed.data);
  return Response.json({ ok: true, installationId }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  if (!body || typeof body.token !== 'string' || body.token.length < 16) return Response.json({ ok: false }, { status: 400 });
  await unregisterInstallation(body.token);
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
