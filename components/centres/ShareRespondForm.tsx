'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { fieldClass } from '@/components/registry/field';

/** Receiving centre: accept/decline a referral, or write the second opinion (or decline). */
export function ShareRespondForm({ shareId, type }: { shareId: string; type: 'REFERRAL' | 'SECOND_OPINION' }) {
  const t = useTranslations('Centres.sharing');
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function send(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(false);
    try {
      const res = await fetch(`/api/centre/shares/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  const primary = 'inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60';
  const secondary = 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium disabled:opacity-60';

  return (
    <div className="flex flex-col gap-3">
      <textarea
        aria-label={t(type === 'SECOND_OPINION' ? 'opinionLabel' : 'declineReason')}
        placeholder={t(type === 'SECOND_OPINION' ? 'opinionLabel' : 'declineReason')}
        rows={type === 'SECOND_OPINION' ? 5 : 2}
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={fieldClass}
      />
      <div className="flex flex-wrap items-center gap-3">
        {type === 'REFERRAL' ? (
          <button type="button" disabled={busy !== null} onClick={() => send({ action: 'ACCEPT' }, 'accept')} className={primary}>
            {busy === 'accept' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {t('accept')}
          </button>
        ) : (
          <button type="button" disabled={busy !== null || text.trim().length < 10} onClick={() => send({ action: 'RESPOND', response: text }, 'respond')} className={primary}>
            {busy === 'respond' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {t('respond')}
          </button>
        )}
        <button type="button" disabled={busy !== null} onClick={() => send({ action: 'DECLINE', ...(text.trim() && type === 'REFERRAL' ? { reason: text } : {}) }, 'decline')} className={secondary}>
          {busy === 'decline' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          {t('decline')}
        </button>
        {error && <span role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</span>}
      </div>
    </div>
  );
}
