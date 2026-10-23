// NVAR field-level cryptography. THE ONLY module allowed to touch the registry
// keys. Implements AES-256-GCM field encryption and HMAC-SHA256 blind indexes
// exactly per docs/registry/SECURITY.md §2. Node runtime only.
//
// Ciphertext string format:  v1.<iv b64>.<tag b64>.<ct b64>   (stored in TEXT columns)
// Blind index:               hmacSHA256(INDEX_KEY, "<kind>:<normalized>")  -> hex(64)

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { normalizeCnic, normalizePhone, normalizePmc } from './normalize';

export { normalizeCnic, normalizePhone, normalizePmc } from './normalize';

/** Thrown on any key/format/tamper error. Callers must return 500 without detail. */
export class RegistryCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryCryptoError';
  }
}

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION = 'v1';

/* -------------------------------------------------------------------------- */
/*  Key loading & validation (lazy, memoized)                                 */
/* -------------------------------------------------------------------------- */

type Keys = { enc: Buffer; idx: Buffer };
let cachedKeys: Keys | null = null;

function loadKey(name: 'REGISTRY_ENCRYPTION_KEY' | 'REGISTRY_INDEX_KEY'): Buffer {
  const raw = process.env[name];
  if (!raw || raw.trim() === '') {
    throw new RegistryCryptoError(
      `${name} is not set. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new RegistryCryptoError(
      `${name} must be base64 of exactly 32 bytes (decoded to ${buf.length} bytes).`,
    );
  }
  return buf;
}

function keys(): Keys {
  if (cachedKeys) return cachedKeys;
  const enc = loadKey('REGISTRY_ENCRYPTION_KEY');
  const idx = loadKey('REGISTRY_INDEX_KEY');
  if (enc.length === idx.length && timingSafeEqual(enc, idx)) {
    throw new RegistryCryptoError(
      'REGISTRY_ENCRYPTION_KEY and REGISTRY_INDEX_KEY must be different values.',
    );
  }
  cachedKeys = { enc, idx };
  return cachedKeys;
}

/** Force key validation up front (e.g. seed script / health check). */
export function assertRegistryCryptoConfig(): void {
  keys();
}

/* -------------------------------------------------------------------------- */
/*  Field encryption                                                          */
/* -------------------------------------------------------------------------- */

/** Encrypt a required plaintext value to `v1.<iv>.<tag>.<ct>`. */
export function encryptField(plaintext: string): string {
  const { enc } = keys();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, enc, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

/** Decrypt a `v1.…` ciphertext. Verifies the GCM auth tag; throws on tamper. */
export function decryptField(ciphertext: string): string {
  const { enc } = keys();
  const parts = ciphertext.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new RegistryCryptoError('Unrecognized ciphertext format.');
  }
  const [, ivB64, tagB64, ctB64] = parts;
  try {
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = createDecipheriv(ALGO, enc, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    throw new RegistryCryptoError('Decryption failed (tampered ciphertext or wrong key).');
  }
}

/** Encrypt an optional value; empty/blank → null (nullable PII columns). */
export function encryptNullable(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : encryptField(trimmed);
}

/** Decrypt an optional column; null/undefined passes through. */
export function decryptNullable(ciphertext: string | null | undefined): string | null {
  if (ciphertext === null || ciphertext === undefined) return null;
  return decryptField(ciphertext);
}

/* -------------------------------------------------------------------------- */
/*  Blind index (equality-only, keyed HMAC)                                   */
/* -------------------------------------------------------------------------- */

export type BlindIndexKind = 'cnic' | 'phone' | 'pmc';

/** Deterministic, non-reversible index for exact-match lookup / dedup. */
export function blindIndex(value: string, kind: BlindIndexKind): string {
  const { idx } = keys();
  const normalized =
    kind === 'cnic'
      ? normalizeCnic(value)
      : kind === 'phone'
        ? normalizePhone(value)
        : normalizePmc(value);
  return createHmac('sha256', idx).update(`${kind}:${normalized}`).digest('hex');
}

/* -------------------------------------------------------------------------- */
/*  File encryption (centre uploads, docs/centres/PLAN.md)                    */
/* -------------------------------------------------------------------------- */

// Layout: "PSV1" | iv (12) | auth tag (16) | ciphertext. `aad` (the file's storage key) is
// authenticated, so a ciphertext file moved to another record fails to decrypt.
const FILE_MAGIC = Buffer.from('PSV1');
const TAG_BYTES = 16;

export function encryptBytes(plain: Buffer, aad: string): Buffer {
  const { enc } = keys();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, enc, iv);
  cipher.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([FILE_MAGIC, iv, cipher.getAuthTag(), ct]);
}

export function decryptBytes(blob: Buffer, aad: string): Buffer {
  const { enc } = keys();
  const head = FILE_MAGIC.length + IV_BYTES + TAG_BYTES;
  if (blob.length < head || !blob.subarray(0, FILE_MAGIC.length).equals(FILE_MAGIC)) {
    throw new RegistryCryptoError('Unrecognized file format.');
  }
  try {
    const iv = blob.subarray(FILE_MAGIC.length, FILE_MAGIC.length + IV_BYTES);
    const tag = blob.subarray(FILE_MAGIC.length + IV_BYTES, head);
    const decipher = createDecipheriv(ALGO, enc, iv);
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(blob.subarray(head)), decipher.final()]);
  } catch {
    throw new RegistryCryptoError('File decryption failed (tampered file or wrong key).');
  }
}
