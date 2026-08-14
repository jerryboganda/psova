import 'server-only';
import { contactPayloadSchema, contactRequestSchema, type ContactRequest, type ContactResponse } from '@psova/domain';
import { deliverContactEmail } from './email';
import { hasDurableKv, serverEnv } from './env';
import { kvGet, kvSet } from './kv';
import { clientIdentity, rateLimit } from './rate-limit';

function json(body: ContactResponse, status: number, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export async function handleContact(request: Request, options: { acceptLegacyPayload?: boolean } = {}): Promise<Response> {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ ok: false, status: 'rejected', submissionId: 'unknown', message: 'Expected JSON.' }, 415);
  }
  const text = await request.text();
  if (text.length > 24_000) return json({ ok: false, status: 'rejected', submissionId: 'unknown', message: 'Request is too large.' }, 413);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return json({ ok: false, status: 'rejected', submissionId: 'unknown', message: 'Invalid JSON.' }, 400); }
  let parsed = contactRequestSchema.safeParse(raw);
  if (!parsed.success && options.acceptLegacyPayload) {
    const payload = contactPayloadSchema.safeParse(raw);
    if (payload.success) parsed = contactRequestSchema.safeParse({ clientSubmissionId: crypto.randomUUID(), payload: payload.data, appVersion: 'web' });
  }
  if (!parsed.success) return json({ ok: false, status: 'rejected', submissionId: 'invalid', message: 'Invalid submission.' }, 400);
  const submission: ContactRequest = parsed.data;
  if (submission.payload.website) return json({ ok: true, status: 'accepted', submissionId: submission.clientSubmissionId }, 202);

  const limiter = await rateLimit({ scope: 'contact', identity: clientIdentity(request), limit: 8, windowSeconds: 600 });
  if (!limiter.allowed) return json({ ok: false, status: 'retryable', submissionId: submission.clientSubmissionId, message: 'Too many requests.', retryAfterSeconds: limiter.retryAfterSeconds }, 429, { 'Retry-After': String(limiter.retryAfterSeconds) });

  if (process.env.NODE_ENV === 'production' && !hasDurableKv(serverEnv())) {
    return json({ ok: false, status: 'retryable', submissionId: submission.clientSubmissionId, message: 'Delivery storage is not configured.', retryAfterSeconds: 900 }, 503, { 'Retry-After': '900' });
  }
  const ledgerKey = `contact:submission:${submission.clientSubmissionId}`;
  const existing = await kvGet(ledgerKey);
  if (existing) {
    const ledger = JSON.parse(existing) as { status: string };
    if (ledger.status === 'accepted') return json({ ok: true, status: 'duplicate', submissionId: submission.clientSubmissionId }, 200);
  }
  await kvSet(ledgerKey, JSON.stringify({ status: 'sending', createdAt: new Date().toISOString() }), { ttlSeconds: 60 * 60 * 24 * 90, onlyIfMissing: true });
  try {
    const acceptance = await deliverContactEmail(submission);
    await kvSet(ledgerKey, JSON.stringify({ status: 'accepted', ...acceptance }), { ttlSeconds: 60 * 60 * 24 * 90 });
    return json({ ok: true, status: 'accepted', submissionId: submission.clientSubmissionId }, 202);
  } catch (error) {
    const retryable = (error as { retryable?: boolean }).retryable !== false;
    await kvSet(ledgerKey, JSON.stringify({ status: retryable ? 'retryable' : 'rejected', updatedAt: new Date().toISOString() }), { ttlSeconds: 60 * 60 * 24 });
    return json({ ok: false, status: retryable ? 'retryable' : 'rejected', submissionId: submission.clientSubmissionId, message: retryable ? 'Delivery is temporarily unavailable.' : 'Submission was rejected.', retryAfterSeconds: retryable ? 300 : undefined }, retryable ? 503 : 422, retryable ? { 'Retry-After': '300' } : undefined);
  }
}
