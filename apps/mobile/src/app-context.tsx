import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContentSnapshot, Locale } from '@psova/domain';
import { direction, mobileMessages, type Messages } from './i18n';
import { loadInitialSnapshot, refreshSnapshot } from './content';
import { flushOutbox } from './outbox';
import { defaultSettings, loadFavorites, loadSettings, saveSettings, setFavorite, type Settings } from './storage';

interface AppState {
  snapshot: ContentSnapshot | null;
  loading: boolean;
  error: string | null;
  online: boolean;
  refreshing: boolean;
  settings: Settings;
  favorites: Set<string>;
  messages: Messages;
  setLocale(locale: Locale): Promise<void>;
  setTheme(theme: Settings['theme']): Promise<void>;
  completeOnboarding(): Promise<void>;
  replayOnboarding(): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  refresh(): Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([loadInitialSnapshot(), loadSettings(), loadFavorites()])
      .then(([content, savedSettings, savedFavorites]) => {
        setSnapshot(content); setSettingsState(savedSettings); setFavorites(savedFavorites);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'App data could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); void flushOutbox(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.locale;
    document.documentElement.dir = direction(settings.locale);
    document.documentElement.dataset.theme = settings.theme;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(settings.locale === 'ur' ? -document.documentElement.scrollWidth : 0, window.scrollY);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [settings]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    await saveSettings(next);
  }, [settings]);

  const refresh = useCallback(async () => {
    if (!snapshot || !navigator.onLine) return;
    setRefreshing(true); setError(null);
    try { setSnapshot(await refreshSnapshot(snapshot)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Refresh failed.'); }
    finally { setRefreshing(false); }
  }, [snapshot]);

  const value = useMemo<AppState>(() => ({
    snapshot, loading, error, online, refreshing, settings, favorites,
    messages: mobileMessages[settings.locale],
    setLocale: (locale) => updateSettings({ locale }),
    setTheme: (theme) => updateSettings({ theme }),
    completeOnboarding: () => updateSettings({ onboarded: true }),
    replayOnboarding: () => updateSettings({ onboarded: false }),
    toggleFavorite: async (id) => {
      const next = new Set(favorites);
      const favorite = !next.has(id);
      if (favorite) next.add(id); else next.delete(id);
      setFavorites(next);
      await setFavorite(id, favorite);
    },
    refresh,
  }), [snapshot, loading, error, online, refreshing, settings, favorites, updateSettings, refresh]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
