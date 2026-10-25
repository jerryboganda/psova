'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { brandButtonClass, errorClass, fieldClass, labelClass } from '@/components/registry/field';

type Patient = {
  id: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  address: string | null;
  consentContact: boolean;
  consentResearch: boolean;
};

/** Correct a patient's contact details and record/withdraw consent. */
export function PatientEditForm({ patient }: { patient: Patient }) {
  const t = useTranslations('Centres.patients');
  const router = useRouter();
  const [form, setForm] = useState({
    phone: patient.phone,
    altPhone: patient.altPhone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    consentContact: patient.consentContact,
    consentResearch: patient.consentResearch,
  });
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('saving');
    try {
      const res = await fetch(`/api/centre/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setState('error');
        return;
      }
      setState('done');
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-phone" className={labelClass}>{t('phone')}</label>
          <input id="pe-phone" dir="ltr" required className={fieldClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="pe-alt" className={labelClass}>{t('altPhone')}</label>
          <input id="pe-alt" dir="ltr" className={fieldClass} value={form.altPhone} onChange={(e) => setForm((f) => ({ ...f, altPhone: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="pe-email" className={labelClass}>{t('email')}</label>
          <input id="pe-email" type="email" dir="ltr" className={fieldClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="pe-address" className={labelClass}>{t('address')}</label>
          <input id="pe-address" maxLength={300} className={fieldClass} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-cyan)]" checked={form.consentContact} onChange={(e) => setForm((f) => ({ ...f, consentContact: e.target.checked }))} />
          {t('consentContact')}
        </label>
        <label className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-cyan)]" checked={form.consentResearch} onChange={(e) => setForm((f) => ({ ...f, consentResearch: e.target.checked }))} />
          {t('consentResearch')}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === 'saving'} className={brandButtonClass}>
          {state === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t('saveDetails')}
        </button>
        {state === 'done' && <p role="status" className="text-sm text-[var(--color-cyan)]">{t('savedDetails')}</p>}
        {state === 'error' && <p role="alert" className={errorClass}>{t('detailsError')}</p>}
      </div>
    </form>
  );
}
