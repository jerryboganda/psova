import { contentSnapshotSchema, outboxRecordSchema, type ContentSnapshot, type OutboxRecord } from '@psova/domain';
import { isNative } from './native';

const KEYS = {
  settings: 'psova.settings', favorites: 'psova.favorites', snapshot: 'psova.snapshot', outbox: 'psova.outbox',
};

async function database() {
  const { default: Database } = await import('@tauri-apps/plugin-sql');
  return Database.load('sqlite:psova.db');
}

export type Settings = { locale: 'en' | 'ur'; theme: 'system' | 'light' | 'dark'; notifications: boolean };
export const defaultSettings: Settings = { locale: 'en', theme: 'system', notifications: false };

export async function loadSettings(): Promise<Settings> {
  const previewLocale = new URLSearchParams(window.location.search).get('locale');
  if (isNative()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('settings.json', { autoSave: 100 });
    return { ...defaultSettings, ...((await store.get<Partial<Settings>>('settings')) ?? {}), ...(previewLocale === 'en' || previewLocale === 'ur' ? { locale: previewLocale } : {}) };
  }
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEYS.settings) ?? '{}'), ...(previewLocale === 'en' || previewLocale === 'ur' ? { locale: previewLocale } : {}) }; } catch { return { ...defaultSettings, ...(previewLocale === 'en' || previewLocale === 'ur' ? { locale: previewLocale } : {}) }; }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isNative()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('settings.json', { autoSave: 100 });
    await store.set('settings', settings);
    await store.save();
    return;
  }
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadSnapshot(): Promise<ContentSnapshot | null> {
  if (isNative()) {
    const db = await database();
    const rows = await db.select<Array<{ payload: string }>>('SELECT payload FROM content_snapshots WHERE is_current = 1 LIMIT 1');
    if (!rows[0]) return null;
    const parsed = contentSnapshotSchema.safeParse(JSON.parse(rows[0].payload));
    return parsed.success ? parsed.data : null;
  }
  try {
    const raw = localStorage.getItem(KEYS.snapshot);
    if (!raw) return null;
    const parsed = contentSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export async function saveSnapshot(snapshot: ContentSnapshot): Promise<void> {
  const valid = contentSnapshotSchema.parse(snapshot);
  if (isNative()) {
    const db = await database();
    try {
      await db.execute('BEGIN IMMEDIATE');
      await db.execute('UPDATE content_snapshots SET is_current = 0 WHERE is_current = 1');
      await db.execute(
        `INSERT INTO content_snapshots (revision, schema_version, checksum, published_at, payload, is_current, installed_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6)
         ON CONFLICT(revision) DO UPDATE SET payload = excluded.payload, checksum = excluded.checksum,
           published_at = excluded.published_at, is_current = 1`,
        [valid.revision, valid.schemaVersion, valid.checksum, valid.publishedAt, JSON.stringify(valid), new Date().toISOString()],
      );
      await db.execute('COMMIT');
    } catch (error) {
      await db.execute('ROLLBACK').catch(() => undefined);
      throw error;
    }
    return;
  }
  localStorage.setItem(KEYS.snapshot, JSON.stringify(valid));
}

export async function loadFavorites(): Promise<Set<string>> {
  if (isNative()) {
    const db = await database();
    const rows = await db.select<Array<{ center_id: string }>>('SELECT center_id FROM favorites');
    return new Set(rows.map((row) => row.center_id));
  }
  try { return new Set(JSON.parse(localStorage.getItem(KEYS.favorites) ?? '[]')); } catch { return new Set(); }
}

export async function setFavorite(centerId: string, favorite: boolean): Promise<void> {
  if (isNative()) {
    const db = await database();
    if (favorite) await db.execute('INSERT OR IGNORE INTO favorites (center_id, created_at) VALUES ($1, $2)', [centerId, new Date().toISOString()]);
    else await db.execute('DELETE FROM favorites WHERE center_id = $1', [centerId]);
    return;
  }
  const current = await loadFavorites();
  if (favorite) current.add(centerId); else current.delete(centerId);
  localStorage.setItem(KEYS.favorites, JSON.stringify([...current]));
}

export async function loadOutbox(): Promise<OutboxRecord[]> {
  if (isNative()) {
    const db = await database();
    const rows = await db.select<Array<{ request_json: string; id: string; status: OutboxRecord['status']; attempts: number; next_attempt_at: string | null; last_error: string | null; created_at: string; updated_at: string }>>('SELECT * FROM outbox ORDER BY created_at ASC');
    return rows.map((row) => outboxRecordSchema.parse({ id: row.id, request: JSON.parse(row.request_json), status: row.status, attempts: row.attempts, nextAttemptAt: row.next_attempt_at, lastError: row.last_error, createdAt: row.created_at, updatedAt: row.updated_at }));
  }
  try { return outboxRecordSchema.array().parse(JSON.parse(localStorage.getItem(KEYS.outbox) ?? '[]')); } catch { return []; }
}

export async function saveOutboxRecord(record: OutboxRecord): Promise<void> {
  const valid = outboxRecordSchema.parse(record);
  if (isNative()) {
    const db = await database();
    await db.execute(
      `INSERT INTO outbox (id, request_json, status, attempts, next_attempt_at, last_error, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(id) DO UPDATE SET request_json=excluded.request_json,status=excluded.status,attempts=excluded.attempts,
       next_attempt_at=excluded.next_attempt_at,last_error=excluded.last_error,updated_at=excluded.updated_at`,
      [valid.id, JSON.stringify(valid.request), valid.status, valid.attempts, valid.nextAttemptAt, valid.lastError, valid.createdAt, valid.updatedAt],
    );
    return;
  }
  const all = await loadOutbox();
  const next = [...all.filter((item) => item.id !== valid.id), valid].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  localStorage.setItem(KEYS.outbox, JSON.stringify(next));
}

export async function clearLocalData(): Promise<void> {
  if (isNative()) {
    const db = await database();
    await db.execute('DELETE FROM favorites');
    await db.execute("DELETE FROM outbox WHERE status != 'sent'");
    await db.execute('DELETE FROM news_state');
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('settings.json', { autoSave: 100 });
    await store.clear();
    await store.save();
    return;
  }
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
