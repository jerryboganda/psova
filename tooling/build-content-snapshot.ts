import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { contentSnapshotSchema } from '@psova/domain';
import {
  VALIDATED_CENTERS,
  VALIDATED_CONDITIONS,
  VALIDATED_GLOSSARY,
  VALIDATED_NEWS,
} from '@psova/content';

const root = resolve(import.meta.dirname, '..');
const outputs = [
  resolve(root, 'public/content-snapshot.json'),
  resolve(root, 'apps/mobile/public/content-snapshot.json'),
];

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function validateRelationships(): void {
  const conditionSlugs = new Set(VALIDATED_CONDITIONS.map((item) => item.slug));
  assertUnique([...conditionSlugs], 'condition slug');
  assertUnique(VALIDATED_CENTERS.map((item) => item.id), 'center id');
  assertUnique(VALIDATED_NEWS.map((item) => item.id), 'news id');

  for (const center of VALIDATED_CENTERS) {
    for (const slug of center.conditions) {
      if (!conditionSlugs.has(slug)) {
        throw new Error(`Center ${center.id} references unknown condition ${slug}`);
      }
    }
    if (center.phone && /X|PLACEHOLDER/i.test(center.phone)) {
      throw new Error(`Center ${center.id} contains a placeholder phone`);
    }
  }
}

function checksum(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function buildSnapshot(publishedAt: string) {
  validateRelationships();
  const content = {
    review: {
      clinical: 'pending' as const,
      urdu: 'pending' as const,
      directory: 'pending' as const,
    },
    conditions: VALIDATED_CONDITIONS,
    centers: VALIDATED_CENTERS,
    news: VALIDATED_NEWS,
    glossary: VALIDATED_GLOSSARY,
  };
  const digest = checksum(content);
  return contentSnapshotSchema.parse({
    schemaVersion: 1,
    revision: digest.slice(0, 16),
    publishedAt,
    checksum: digest,
    ...content,
  });
}

function existingPublishedAt(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const parsed = contentSnapshotSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  return parsed.success ? parsed.data.publishedAt : undefined;
}

const checkOnly = process.argv.includes('--check');
const publishedAt =
  process.env.PSOVA_CONTENT_PUBLISHED_AT ??
  existingPublishedAt(outputs[0]) ??
  new Date().toISOString();
const snapshot = buildSnapshot(publishedAt);
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

if (checkOnly) {
  for (const output of outputs) {
    if (!existsSync(output)) throw new Error(`Missing generated snapshot: ${output}`);
    const current = readFileSync(output, 'utf8');
    if (current !== serialized) throw new Error(`Stale generated snapshot: ${output}`);
  }
  console.log(`Content snapshot ${snapshot.revision} is valid and current.`);
} else {
  for (const output of outputs) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, serialized, 'utf8');
  }
  console.log(`Wrote content snapshot ${snapshot.revision} to ${outputs.length} targets.`);
}
