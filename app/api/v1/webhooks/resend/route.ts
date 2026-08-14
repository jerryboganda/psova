import { Webhook } from 'svix';
import { serverEnv } from '@/lib/server/env';
import { kvSet } from '@/lib/server/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = serverEnv().RESEND_WEBHOOK_SECRET;
  if (!secret) return Response.json({ ok: false }, { status: 503 });
  const id = request.headers.get('svix-id'); const timestamp = request.headers.get('svix-timestamp'); const signature = request.headers.get('svix-signature');
  if (!id || !timestamp || !signature) return Response.json({ ok: false }, { status: 400 });
  const raw = await request.text(); let event: unknown;
  try { event = new Webhook(secret).verify(raw, { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': signature }); }
  catch { return Response.json({ ok: false }, { status: 400 }); }
  const accepted = await kvSet(`resend:webhook:${id}`, JSON.stringify({ event, receivedAt: new Date().toISOString() }), { ttlSeconds: 60 * 60 * 24 * 90, onlyIfMissing: true });
  return Response.json({ ok: true, duplicate: !accepted });
}
