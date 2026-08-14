import { assertAllowedExternalUrl, parsePsovaDeepLink } from '@psova/domain';

export function isNative(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function openExternal(raw: string): Promise<void> {
  const safe = assertAllowedExternalUrl(raw);
  if (isNative()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const validated = await invoke<string>('validate_external_url', { raw: safe });
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(validated);
    return;
  }
  if (safe.startsWith('tel:') || safe.startsWith('mailto:')) window.location.href = safe;
  else window.open(safe, '_blank', 'noopener,noreferrer');
}

export async function shareContent(data: { title: string; text: string; url?: string }): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share(data);
    return 'shared';
  }
  await navigator.clipboard.writeText([data.title, data.text, data.url].filter(Boolean).join('\n'));
  return 'copied';
}

export async function lightHaptic(): Promise<void> {
  if (!isNative()) return;
  const { impactFeedback } = await import('@tauri-apps/plugin-haptics');
  await impactFeedback('light');
}

export async function requestNewsNotifications(): Promise<boolean> {
  if (!isNative()) return Notification.requestPermission().then((value) => value === 'granted');
  const notifications = await import('@tauri-apps/plugin-notification');
  let granted = await notifications.isPermissionGranted();
  if (!granted) granted = (await notifications.requestPermission()) === 'granted';
  return granted;
}

export async function listenForDeepLinks(onRoute: (path: string) => void): Promise<() => void> {
  if (!isNative()) return () => undefined;
  const { getCurrent, onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
  const route = (raw: string) => {
    try {
      const parsed = parsePsovaDeepLink(raw);
      if (parsed.route === 'condition' && parsed.id) onRoute(`/library/${parsed.id}`);
      else if (parsed.route === 'news' && parsed.id) onRoute(`/news/${parsed.id}`);
      else if (parsed.route === 'directory') onRoute('/directory');
    } catch {
      // Ignore unsupported or malformed deep links.
    }
  };
  (await getCurrent())?.forEach(route);
  return onOpenUrl((urls) => urls.forEach(route));
}
