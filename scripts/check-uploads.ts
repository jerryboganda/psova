// Self-check for encrypted uploads: `npx tsx scripts/check-uploads.ts`.
// Uses throwaway keys and a temp directory; touches no database.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.REGISTRY_ENCRYPTION_KEY = randomBytes(32).toString('base64');
process.env.REGISTRY_INDEX_KEY = randomBytes(32).toString('base64');
const dir = mkdtempSync(join(tmpdir(), 'psova-uploads-'));
process.env.UPLOAD_DIR = dir;

async function main() {
  const { sniffMime, putFile, getFile, removeFile, centreQuotaBytes, safeFileName } = await import('../lib/registry/storage');
  const { decryptBytes, encryptBytes } = await import('../lib/registry/crypto');

  // Type comes from the bytes only.
  assert.equal(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg');
  assert.equal(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png');
  assert.equal(sniffMime(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])), 'image/webp');
  assert.equal(sniffMime(Buffer.from('%PDF-1.7\n')), 'application/pdf');
  assert.equal(sniffMime(Buffer.from('<script>alert(1)</script>')), null); // html renamed to .jpg
  assert.equal(sniffMime(Buffer.from('MZ\x90\x00')), null); // an executable
  assert.equal(sniffMime(Buffer.alloc(0)), null);

  // Round trip; the file on disk is not the plaintext.
  const plain = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), randomBytes(2048)]);
  const key = await putFile('cabcdefgh12345', plain);
  const onDisk = readFileSync(join(dir, 'cabcdefgh12345', `${key}.bin`));
  assert.equal(onDisk.includes(plain.subarray(3, 64)), false);
  assert.deepEqual(await getFile('cabcdefgh12345', key), plain);
  assert.equal(readdirSync(join(dir, 'cabcdefgh12345')).some((f) => f.endsWith('.tmp')), false);

  // Tamper and swap are both detected.
  const blob = encryptBytes(plain, 'key-one-aaaaaaaa');
  assert.throws(() => decryptBytes(blob, 'key-two-bbbbbbbb')); // moved to another record
  blob[blob.length - 1] ^= 1;
  assert.throws(() => decryptBytes(blob, 'key-one-aaaaaaaa')); // flipped bit

  // Path inputs are validated, and the default quota is 2 GB.
  await assert.rejects(() => putFile('../escape', plain));
  assert.equal(centreQuotaBytes(), 2048 * 1024 * 1024);

  // Display names carry no path parts or control characters, and are never empty.
  assert.equal(safeFileName('..\\..\\etc/passwd.jpg', 'image/jpeg'), 'passwd.jpg'); // both separators
  assert.equal(safeFileName('a\u0000b"<c>.png', 'image/png'), 'abc.png'); // NUL and reserved characters
  assert.equal(safeFileName('   ', 'application/pdf'), 'document.pdf');
  assert.equal(safeFileName('x'.repeat(500) + '.pdf', 'application/pdf').length, 120);

  await removeFile('cabcdefgh12345', key);
  await assert.rejects(() => getFile('cabcdefgh12345', key));
  console.log('upload checks passed');
}

main().finally(() => rmSync(dir, { recursive: true, force: true }));
