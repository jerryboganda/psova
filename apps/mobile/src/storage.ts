import { contentSnapshotSchema, outboxRecordSchema, type ContentSnapshot, type OutboxRecord } from '@psova/domain';

const KEYS = {
  settings: 'psova.settings', favorites: 'psova.favorites', snapshot: 'psova.snapshot', outbox: 'psova.outbox',
};

export type Settings = { locale: 'en' | 'ur'; theme: 'system' | 'light' | 'dark'; onboarded: boolean };
export const defaultSettings: Settings = { locale: 'en', theme: 'system', onboarded: false };

export async function loadSettings(): Promise<Settings> {
  const previewLocale = new URLSearchParams(window.location.search).get('locale');
  const locale: Partial<Settings> = previewLocale === 'en' || previewLocale === 'ur' ? { locale: previewLocale } : {};
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEYS.settings) ?? '{}'), ...locale }; } catch { return { ...defaultSettings, ...locale }; }
}

export async function saveSettings(settings: Settings): Promise<void> {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function loadSnapshot(): Promise<ContentSnapshot | null> {
  try {
    const raw = localStorage.getItem(KEYS.snapshot);
    if (!raw) return null;
    const parsed = contentSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export async function saveSnapshot(snapshot: ContentSnapshot): Promise<void> {
  localStorage.setItem(KEYS.snapshot, JSON.stringify(contentSnapshotSchema.parse(snapshot)));
}

export async function loadFavorites(): Promise<Set<string>> {
  try { return new Set(JSON.parse(localStorage.getItem(KEYS.favorites) ?? '[]')); } catch { return new Set(); }
}

export async function setFavorite(centerId: string, favorite: boolean): Promise<void> {
  const current = await loadFavorites();
  if (favorite) current.add(centerId); else current.delete(centerId);
  localStorage.setItem(KEYS.favorites, JSON.stringify([...current]));
}

export async function loadOutbox(): Promise<OutboxRecord[]> {
  try { return outboxRecordSchema.array().parse(JSON.parse(localStorage.getItem(KEYS.outbox) ?? '[]')); } catch { return []; }
}

export async function saveOutboxRecord(record: OutboxRecord): Promise<void> {
  const valid = outboxRecordSchema.parse(record);
  const all = await loadOutbox();
  const next = [...all.filter((item) => item.id !== valid.id), valid].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  localStorage.setItem(KEYS.outbox, JSON.stringify(next));
}

export async function clearLocalData(): Promise<void> {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
