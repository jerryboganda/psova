import 'server-only';
import { createHmac } from 'node:crypto';
import { kvGet, kvSet } from './kv';
import { serverEnv } from './env';

function fingerprint(value: string): string {
  const env = serverEnv();
  const key = env.RATE_LIMIT_HMAC_KEY ?? env.BETTER_AUTH_SECRET ?? 'development-only-rate-limit-key';
  return createHmac('sha256', key).update(value).digest('hex').slice(0, 24);
}

export async function rateLimit(input: { scope: string; identity: string; limit: number; windowSeconds: number }): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const window = Math.floor(Date.now() / (input.windowSeconds * 1000));
  const key = `rate:${input.scope}:${fingerprint(input.identity)}:${window}`;
  const count = Number((await kvGet(key)) ?? '0') + 1;
  await kvSet(key, String(count), { ttlSeconds: input.windowSeconds + 5 });
  const retryAfterSeconds = input.windowSeconds - Math.floor((Date.now() / 1000) % input.windowSeconds);
  return { allowed: count <= input.limit, retryAfterSeconds };
}

export function clientIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const real = request.headers.get('x-real-ip')?.trim();
  return forwarded || real || 'unknown';
}
