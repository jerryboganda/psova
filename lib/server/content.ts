import 'server-only';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { careCenterSchema, contentSnapshotSchema } from '@psova/domain';
import { getListedCenters, toCareCenter } from '@/lib/registry/directory';

type Snapshot = ReturnType<typeof contentSnapshotSchema.parse>;

let cached: Snapshot | undefined;

async function staticSnapshot(): Promise<Snapshot> {
  if (cached) return cached;
  const raw = await readFile(resolve(process.cwd(), 'public/content-snapshot.json'), 'utf8');
  cached = contentSnapshotSchema.parse(JSON.parse(raw));
  return cached;
}

// Same digest as tooling/build-content-snapshot.ts and the mobile verifySnapshot():
// sha256 over JSON.stringify of the schema-parsed content, in this key order.
function digest(s: Snapshot): string {
  const { review, conditions, centers, news, glossary } = s;
  return createHash('sha256').update(JSON.stringify({ review, conditions, centers, news, glossary })).digest('hex');
}

/**
 * The built snapshot plus the registered centres from the database. Re-signed
 * (checksum/revision) only when there are registered centres, so with none the
 * result is byte-identical to the static file.
 */
export async function serverContentSnapshot(): Promise<Snapshot> {
  const base = await staticSnapshot();
  const listed = await getListedCenters();
  if (listed.length === 0) return base;

  const registered = listed.map((row) =>
    careCenterSchema.parse({
      ...toCareCenter(row),
      // The content type carries a plain phone; the snapshot schema wants null for placeholders.
      verification: { status: 'verified', verifiedAt: row.approvedAt?.toISOString() ?? null, source: null },
    }),
  );
  const merged = { ...base, centers: [...base.centers, ...registered] };
  const checksum = digest(merged);
  return contentSnapshotSchema.parse({ ...merged, checksum, revision: checksum.slice(0, 16) });
}
