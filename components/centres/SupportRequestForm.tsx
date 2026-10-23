'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { SUPPORT_MAX_COST_PKR, SUPPORT_MIN_COST_PKR } from '@/lib/registry/constants';
import { fieldClass, labelClass } from '@/components/registry/field';

/** Ask PSOVA to raise funds for a patient's treatment. The blurb is public after PSOVA approves it, so it must identify no one. */
export function SupportRequestForm({ patientId }: { patientId: string }) {
  const t = useTranslations('Centres.support');
  const router = useRouter();
  const [treatment, setTreatment] = useState('');
  const [cost, setCost] = useState('');
  const [blurbEn, setBlurbEn] = useState('');
  const [blurbUr, setBlurbUr] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'error'; message?: string }>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/centre/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          treatment,
          estimatedCostPkr: Number(cost),
          blurbEn,
          confirmed,
          ...(blurbUr.trim() ? { blurbUr } : {}),
        }),
      });
      if (res.ok) {
        router.push('/centre/support');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setState({ kind: 'error', message: data?.error === 'conflict' ? t('alreadyOpen') : t('error') });
    } catch {
      setState({ kind: 'error', message: t('error') });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100/90">{t('warning')}</p>

      <div>
        <label htmlFor="sf-treatment" className={labelClass}>{t('treatment')}</label>
        <input id="sf-treatment" required minLength={5} maxLength={160} value={treatment} onChange={(e) => setTreatment(e.target.value)} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="sf-cost" className={labelClass}>{t('cost')}</label>
        <input
          id="sf-cost"
          type="number"
          required
          min={SUPPORT_MIN_COST_PKR}
          max={SUPPORT_MAX_COST_PKR}
          step={500}
          inputMode="numeric"
          dir="ltr"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-[var(--color-faint)]">{t('costHint')}</p>
      </div>

      <div>
        <label htmlFor="sf-en" className={labelClass}>{t('blurbEn')}</label>
        <textarea id="sf-en" required minLength={40} maxLength={1200} rows={5} value={blurbEn} onChange={(e) => setBlurbEn(e.target.value)} className={fieldClass} />
        <p className="mt-1 text-xs text-[var(--color-faint)]">{t('blurbHint')}</p>
      </div>

      <div>
        <label htmlFor="sf-ur" className={labelClass}>{t('blurbUr')}</label>
        <textarea id="sf-ur" dir="rtl" maxLength={1200} rows={5} value={blurbUr} onChange={(e) => setBlurbUr(e.target.value)} className={fieldClass} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">
        <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-cyan)]" />
        <span>{t('confirm')}</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state.kind === 'sending' || !confirmed}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state.kind === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('submit')}
        </button>
        {state.kind === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{state.message}</p>}
      </div>
    </form>
  );
}
