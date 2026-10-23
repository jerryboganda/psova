'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { APPOINTMENT_KINDS } from '@/lib/registry/constants';
import { pktLocalToIso } from '@/lib/registry/centre-time';
import { fieldClass, labelClass } from '@/components/registry/field';

/** Book an appointment for a patient. The picker is read as centre (PKT) wall-clock time. */
export function AppointmentForm({ patientId }: { patientId: string }) {
  const t = useTranslations('Centres.appointments');
  const router = useRouter();
  const [startsAt, setStartsAt] = useState('');
  const [kind, setKind] = useState<(typeof APPOINTMENT_KINDS)[number]>('FOLLOW_UP');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/centre/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, startsAt: pktLocalToIso(startsAt), kind, ...(note.trim() ? { note: note.trim() } : {}) }),
      });
      if (!res.ok) throw new Error();
      setStartsAt('');
      setNote('');
      setStatus('done');
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ap-when" className={labelClass}>{t('when')}</label>
          <input id="ap-when" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="ap-kind" className={labelClass}>{t('kind')}</label>
          <select id="ap-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={fieldClass}>
            {APPOINTMENT_KINDS.map((k) => (
              <option key={k} value={k}>{t(`kinds.${k}`)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="ap-note" className={labelClass}>{t('note')}</label>
        <input id="ap-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending' || !startsAt}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
          {t('book')}
        </button>
        {status === 'done' && <p role="status" className="text-sm text-[var(--color-cyan)]">{t('booked')}</p>}
        {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}
