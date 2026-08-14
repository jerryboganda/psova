import { contentSnapshotSchema, shouldReplaceSnapshot, type ContentSnapshot } from '@psova/domain';
import { loadSnapshot, saveSnapshot } from './storage';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'https://psova.polytronx.com';

async function digestContent(snapshot: ContentSnapshot): Promise<string> {
  const content = {
    review: snapshot.review,
    conditions: snapshot.conditions,
    centers: snapshot.centers,
    news: snapshot.news,
    glossary: snapshot.glossary,
  };
  const data = new TextEncoder().encode(JSON.stringify(content));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function verifySnapshot(value: unknown): Promise<ContentSnapshot> {
  const parsed = contentSnapshotSchema.parse(value);
  const checksum = await digestContent(parsed);
  if (checksum !== parsed.checksum) throw new Error('Content checksum mismatch');
  return parsed;
}

async function bundledSnapshot(): Promise<ContentSnapshot> {
  const response = await fetch('/content-snapshot.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Bundled content snapshot is unavailable');
  return verifySnapshot(await response.json());
}

export async function loadInitialSnapshot(): Promise<ContentSnapshot> {
  const cached = await loadSnapshot();
  if (cached) {
    try { return await verifySnapshot(cached); } catch { /* fall through to bundled snapshot */ }
  }
  const bundled = await bundledSnapshot();
  await saveSnapshot(bundled);
  return bundled;
}

export async function refreshSnapshot(current: ContentSnapshot): Promise<ContentSnapshot> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${API_BASE}/api/v1/content/snapshot`, {
      headers: { Accept: 'application/json', 'If-None-Match': `"${current.checksum}"` },
      signal: controller.signal,
    });
    if (response.status === 304) return current;
    if (!response.ok) throw new Error(`Content refresh failed (${response.status})`);
    const next = await verifySnapshot(await response.json());
    if (!shouldReplaceSnapshot({ currentRevision: current.revision, nextRevision: next.revision, currentSchemaVersion: current.schemaVersion, nextSchemaVersion: next.schemaVersion, checksumValid: true })) return current;
    await saveSnapshot(next);
    return next;
  } finally {
    window.clearTimeout(timeout);
  }
}
