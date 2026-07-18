// Tracking codes: PSV-XXXX-XXXX using the Crockford base32 alphabet (0-9 A-Z
// minus I, L, O, U — the visually ambiguous letters). A tracking code alone is
// not PII (SECURITY §5.7). Randomness uses node:crypto, never Math.random.

import { randomBytes } from 'node:crypto';

// Crockford base32 — 32 symbols, so `byte % 32` is unbiased (256 is a multiple of 32).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const GROUP = 4;

function randomGroup(len: number): string {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** e.g. "PSV-A7K2-9MQ4". */
export function generateTrackingCode(): string {
  return `PSV-${randomGroup(GROUP)}-${randomGroup(GROUP)}`;
}

/**
 * Normalize user-entered codes: uppercase, drop separators/whitespace, map
 * Crockford confusables (O→0, I/L→1, U→V), re-insert the canonical dashes.
 * Malformed input is returned in canonical shape so exact-match lookup simply
 * misses → uniform "not found".
 */
export function normalizeTrackingCode(input: string): string {
  let s = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  s = s.replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  if (s.length === 11 && s.startsWith('PSV')) s = s.slice(3);
  if (s.length !== 8) return `PSV-${s}`;
  return `PSV-${s.slice(0, GROUP)}-${s.slice(GROUP)}`;
}

/**
 * Generate a tracking code that does not yet exist. `exists` is injected so this
 * module stays free of a Prisma dependency. Retries on the (astronomically
 * unlikely) collision.
 */
export async function generateUniqueTrackingCode(
  exists: (code: string) => Promise<boolean>,
  maxTries = 6,
): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    const code = generateTrackingCode();
    if (!(await exists(code))) return code;
  }
  throw new Error('Could not generate a unique tracking code after multiple attempts.');
}
