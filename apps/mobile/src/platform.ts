import { assertAllowedExternalUrl } from '@psova/domain';

export async function openExternal(raw: string): Promise<void> {
  const safe = assertAllowedExternalUrl(raw);
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

/** A short tick on Android browsers; iOS Safari has no vibration API and ignores it. */
export async function lightHaptic(): Promise<void> {
  navigator.vibrate?.(8);
}
