'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CircleOff, Loader2, UserX } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const btn =
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60';

/** Done / missed / cancelled for a scheduled appointment (read-only once decided). */
export function AppointmentActions({ id, status, readOnly = false }: { id: string; status: string; readOnly?: boolean }) {
  const t = useTranslations('Centres.appointments');
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function set(next: 'DONE' | 'MISSED' | 'CANCELLED') {
    setBusy(next);
    setFailed(false);
    try {
      const res = await fetch(`/api/centre/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STATUS', status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (status !== 'SCHEDULED') {
    return <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]">{t(`statuses.${status}`)}</span>;
  }

  if (readOnly) {
    return (
      <span className="text-xs text-[var(--color-faint)]">
        {t(`statuses.${status}`)} · {t('readOnly')}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy !== null} onClick={() => set('DONE')} className={cn(btn, 'border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]')}>
        {busy === 'DONE' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        {t('markDone')}
      </button>
      <button type="button" disabled={busy !== null} onClick={() => set('MISSED')} className={cn(btn, 'border-amber-400/40 bg-amber-400/10 text-amber-200')}>
        <UserX className="size-3.5" />
        {t('markMissed')}
      </button>
      <button type="button" disabled={busy !== null} onClick={() => set('CANCELLED')} className={cn(btn, 'border-white/10 bg-white/5 text-[var(--color-muted)]')}>
        <CircleOff className="size-3.5" />
        {t('cancel')}
      </button>
      {failed && <span role="alert" className="text-xs text-[var(--color-rose)]">{t('error')}</span>}
    </div>
  );
}
