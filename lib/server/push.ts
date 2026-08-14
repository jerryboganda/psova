import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, createSign, randomBytes } from 'node:crypto';
import type { PushRegistration } from '@psova/domain';
import { serverEnv } from './env';
import { kvAddToSet, kvDelete, kvGet, kvRemoveFromSet, kvSet, kvSetMembers } from './kv';

const INSTALLATIONS_KEY = 'push:installations:v1';
let oauthCache: { token: string; expiresAt: number } | undefined;

function keyMaterial(): Buffer {
  const secret = serverEnv().PUSH_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error('Push token encryption is not configured');
  return createHash('sha256').update(secret).digest();
}
function fingerprint(token: string): string { return createHmac('sha256', keyMaterial()).update(token).digest('hex'); }
function encrypt(token: string): { ciphertext: string; iv: string; tag: string } { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', keyMaterial(), iv); const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]); return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') }; }
function decrypt(data: { ciphertext: string; iv: string; tag: string }): string { const decipher = createDecipheriv('aes-256-gcm', keyMaterial(), Buffer.from(data.iv, 'base64')); decipher.setAuthTag(Buffer.from(data.tag, 'base64')); return Buffer.concat([decipher.update(Buffer.from(data.ciphertext, 'base64')), decipher.final()]).toString('utf8'); }
function base64Url(value: string | Buffer): string { return Buffer.from(value).toString('base64url'); }

async function accessToken(): Promise<string> {
  if (oauthCache && oauthCache.expiresAt > Date.now() + 60_000) return oauthCache.token;
  const env = serverEnv();
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) throw new Error('Firebase delivery is not configured');
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ iss: env.FIREBASE_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`; const signer = createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), cache: 'no-store' });
  if (!response.ok) throw new Error('Firebase OAuth authentication failed');
  const body = await response.json() as { access_token: string; expires_in: number };
  oauthCache = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

export async function registerInstallation(registration: PushRegistration): Promise<string> {
  const id = fingerprint(registration.token); const encrypted = encrypt(registration.token);
  await kvSet(`push:installation:${id}`, JSON.stringify({ ...encrypted, platform: registration.platform, locale: registration.locale, appVersion: registration.appVersion, consentedAt: registration.consentedAt, lastSeenAt: new Date().toISOString(), disabledAt: null }), { ttlSeconds: 60 * 60 * 24 * 180 });
  await kvAddToSet(INSTALLATIONS_KEY, id); return id;
}
export async function unregisterInstallation(token: string): Promise<void> { const id = fingerprint(token); await kvDelete(`push:installation:${id}`); await kvRemoveFromSet(INSTALLATIONS_KEY, id); }

async function sendMessage(token: string, input: { eventId: string; title: string; body: string; deepLink: string; dryRun: boolean }): Promise<{ ok: boolean; invalid: boolean }> {
  const env = serverEnv(); if (!env.FIREBASE_PROJECT_ID) throw new Error('Firebase project is not configured');
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/messages:send`, {
    method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ validate_only: input.dryRun, message: { token, notification: { title: input.title, body: input.body }, data: { eventId: input.eventId, deepLink: input.deepLink }, android: { ttl: '86400s', collapse_key: input.eventId }, apns: { headers: { 'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400), 'apns-collapse-id': input.eventId }, payload: { aps: { category: 'PSOVA_NEWS' } } } } }), cache: 'no-store',
  });
  if (response.ok) return { ok: true, invalid: false };
  const error = await response.text(); const invalid = response.status === 404 || /UNREGISTERED|registration-token-not-registered/i.test(error);
  if (response.status === 429 || response.status >= 500) throw Object.assign(new Error('FCM temporarily unavailable'), { retryable: true });
  return { ok: false, invalid };
}

export async function publishPush(input: { eventId: string; title: string; body: string; deepLink: string; dryRun: boolean }): Promise<{ attempted: number; accepted: number; invalidated: number; failed: number }> {
  const ledgerKey = `push:event:${input.eventId}`; if (await kvGet(ledgerKey)) throw new Error('Push event has already been published');
  await kvSet(ledgerKey, JSON.stringify({ status: 'sending', createdAt: new Date().toISOString() }), { ttlSeconds: 60 * 60 * 24 * 90, onlyIfMissing: true });
  const ids = await kvSetMembers(INSTALLATIONS_KEY); let accepted = 0; let invalidated = 0; let failed = 0;
  for (let offset = 0; offset < ids.length; offset += 20) {
    const chunk = ids.slice(offset, offset + 20);
    const results = await Promise.all(chunk.map(async (id) => { const raw = await kvGet(`push:installation:${id}`); if (!raw) return { id, skipped: true, ok: false, invalid: false }; const record = JSON.parse(raw) as { ciphertext: string; iv: string; tag: string }; return { id, skipped: false, ...(await sendMessage(decrypt(record), input)) }; }));
    for (const result of results) { if (result.skipped) continue; if (result.ok) accepted += 1; else if (result.invalid) { invalidated += 1; await kvDelete(`push:installation:${result.id}`); await kvRemoveFromSet(INSTALLATIONS_KEY, result.id); } else failed += 1; }
  }
  await kvSet(ledgerKey, JSON.stringify({ status: 'completed', attempted: ids.length, accepted, invalidated, failed, dryRun: input.dryRun, completedAt: new Date().toISOString() }), { ttlSeconds: 60 * 60 * 24 * 90 });
  return { attempted: ids.length, accepted, invalidated, failed };
}
