// In-memory sliding-window rate limiter. Single Hostinger Node process makes this
// sufficient for v1 (ARCHITECTURE §6 / SECURITY §5.2). Limitation: counters reset
// on restart/redeploy — acceptable and documented.

type Timestamps = number[];
const store = new Map<string, Timestamps>();

const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const SWEEP_MAX_AGE_MS = 60 * 60 * 1000; // largest window we use is 1h
let lastSweep = Date.now();

function maybeSweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  const cutoff = now - SWEEP_MAX_AGE_MS;
  for (const [key, hits] of store) {
    const pruned = hits.filter((t) => t > cutoff);
    if (pruned.length === 0) store.delete(key);
    else store.set(key, pruned);
  }
}

export type RateResult = { ok: boolean; retryAfter: number; remaining: number };

/** Named limits per SECURITY §5.2 (all per-IP, sliding 1h window). */
export const RATE_LIMITS = {
  enroll: { max: 5, windowMs: 60 * 60 * 1000 },
  status: { max: 10, windowMs: 60 * 60 * 1000 },
  register: { max: 10, windowMs: 60 * 60 * 1000 },
  centerApply: { max: 5, windowMs: 60 * 60 * 1000 },
  centerStaff: { max: 30, windowMs: 60 * 60 * 1000 },
  // A waiting room scanning the QR code shares one clinic wifi IP, so this is looser than `enroll`.
  centreIntake: { max: 40, windowMs: 60 * 60 * 1000 },
  stats: { max: 60, windowMs: 60 * 60 * 1000 },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

/** Record a hit and report whether it is within the window budget. */
export function rateLimit(
  bucket: string,
  ip: string,
  max: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  maybeSweep(now);
  const key = `${bucket}:${ip}`;
  const cutoff = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= max) {
    store.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false, retryAfter, remaining: 0 };
  }

  hits.push(now);
  store.set(key, hits);
  return { ok: true, retryAfter: 0, remaining: max - hits.length };
}

/** Boolean form matching the API-SPEC §5 signature. */
export function limit(bucket: string, ip: string, max: number, windowMs: number): boolean {
  return rateLimit(bucket, ip, max, windowMs).ok;
}

/** Convenience wrapper using a named RATE_LIMITS bucket. */
export function checkLimit(bucket: RateBucket, ip: string): RateResult {
  const { max, windowMs } = RATE_LIMITS[bucket];
  return rateLimit(bucket, ip, max, windowMs);
}
