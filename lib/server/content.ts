import 'server-only';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contentSnapshotSchema } from '@psova/domain';

let cached: ReturnType<typeof contentSnapshotSchema.parse> | undefined;

export async function serverContentSnapshot() {
  if (cached) return cached;
  const raw = await readFile(resolve(process.cwd(), 'public/content-snapshot.json'), 'utf8');
  cached = contentSnapshotSchema.parse(JSON.parse(raw));
  return cached;
}
