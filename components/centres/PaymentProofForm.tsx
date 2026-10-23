'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { centerPaymentProofSchema, type CenterPaymentProofInput } from '@/lib/registry/schemas';
import { CENTER_PAYMENT_METHODS } from '@/lib/registry/constants';
import { FormField } from '@/components/registry/FormField';
import { brandButtonClass, fieldClass } from '@/components/registry/field';

/** Renewal / first payment proof. An admin verifies it against the PSOVA account. */
export function PaymentProofForm() {
  const t = useTranslations('Centres.membership');
  const ta = useTranslations('Centres.apply');
  const tc = useTranslations('RegistryCommon');
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error' | 'limit'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CenterPaymentProofInput>({ resolver: zodResolver(centerPaymentProofSchema) });

  async function submit(values: CenterPaymentProofInput) {
    setStatus('sending');
    try {
      const res = await fetch('/api/centre/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        reset();
        setStatus('done');
        router.refresh();
      } else {
        setStatus(res.status === 409 ? 'limit' : 'error');
      }
    } catch {
      setStatus('error');
    }
  }

  const err = (has: unknown) => (has ? ta('errors.invalid') : undefined);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="pm-method" label={ta('payment.method')} required error={err(errors.method)}>
          <select id="pm-method" className={fieldClass} defaultValue="" aria-invalid={!!errors.method} aria-describedby="pm-method-error" {...register('method')}>
            <option value="" disabled>{tc('select')}</option>
            {CENTER_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{ta(`payment.methods.${m}`)}</option>
            ))}
          </select>
        </FormField>
        <FormField id="pm-txn" label={ta('payment.txnRef')} required error={err(errors.txnRef)}>
          <input id="pm-txn" dir="ltr" className={fieldClass} aria-invalid={!!errors.txnRef} aria-describedby="pm-txn-error" {...register('txnRef')} />
        </FormField>
        <FormField id="pm-date" label={ta('payment.paidOn')} required error={err(errors.paidOn)}>
          <input id="pm-date" type="date" className={fieldClass} aria-invalid={!!errors.paidOn} aria-describedby="pm-date-error" {...register('paidOn')} />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'sending'} className={brandButtonClass}>
          {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('submit')}
        </button>
        {status === 'done' && <p role="status" className="text-sm text-[var(--color-cyan)]">{t('done')}</p>}
        {status === 'limit' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('limit')}</p>}
        {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}
