'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { SHARE_TYPES } from '@/lib/registry/constants';
import { fieldClass, labelClass } from '@/components/registry/field';

/** Refer a patient to another centre (identified) or ask another centre for a second opinion (de-identified). */
export function SendShareForm({
  patientId,
  targets,
}: {
  patientId: string;
  targets: { id: string; name: string; city: string }[];
}) {
  const t = useTranslations('Centres.sharing');
  const router = useRouter();
  const [type, setType] = useState<(typeof SHARE_TYPES)[number]>('REFERRAL');
  const [toCenterId, setTo] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; message?: string }>({ kind: 'idle' });

  if (targets.length === 0) return <p className="text-sm text-[var(--color-muted)]">{t('noTargets')}</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      const res = await fetch(`/api/centre/patients/${patientId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toCenterId, type, note, confirmed }),
      });
      if (res.ok) {
        setNote('');
        setConfirmed(false);
        setState({ kind: 'ok', message: t('sent') });
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">{t('typeLabel')}</legend>
        {SHARE_TYPES.map((v) => (
          <label
            key={v}
            className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm has-[:checked]:border-[var(--color-cyan)]/50 has-[:checked]:bg-[var(--color-cyan)]/10"
          >
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="share-type" checked={type === v} onChange={() => setType(v)} className="accent-[var(--color-cyan)]" />
              {t(`types.${v}`)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">{t(`typeHelp.${v}`)}</span>
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="sh-to" className={labelClass}>{t('toCentre')}</label>
        <select id="sh-to" required value={toCenterId} onChange={(e) => setTo(e.target.value)} className={fieldClass}>
          <option value="" disabled>{t('chooseCentre')}</option>
          {targets.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sh-note" className={labelClass}>{t(type === 'REFERRAL' ? 'noteReferral' : 'noteOpinion')}</label>
        <textarea id="sh-note" required minLength={10} maxLength={2000} rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[var(--color-muted)]">
        <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-cyan)]" />
        <span>{t(type === 'REFERRAL' ? 'confirmReferral' : 'confirmOpinion')}</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state.kind === 'sending' || !toCenterId || !confirmed || note.trim().length < 10}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state.kind === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('send')}
        </button>
        {state.kind === 'ok' && <p role="status" className="text-sm text-[var(--color-cyan)]">{state.message}</p>}
        {state.kind === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{state.message}</p>}
      </div>
    </form>
  );
}
