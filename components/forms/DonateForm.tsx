'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2, Check, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WhatsappIcon } from '@/components/icons/Social';
import { SITE } from '@/data/site';
import { telHref, whatsappHref } from '@/lib/contact';

const schema = z
  .object({
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    amount: z.string().optional(),
    designation: z.enum(['general', 'zakat', 'sponsor-child', 'recurring']),
    method: z.enum(['any', 'bank', 'jazzcash', 'easypaisa', 'raast', 'international']),
    preferredContact: z.enum(['phone', 'whatsapp', 'email']),
    message: z.string().optional(),
  })
  .refine(
    (d) => (!!d.phone && d.phone.trim().length >= 6) || (!!d.email && d.email.length > 0),
    { message: 'contact', path: ['phone'] },
  );
type Values = z.infer<typeof schema>;

const field =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--color-faint)] transition-colors focus:border-[var(--color-cyan)]/60 focus:outline-none';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)]';

export function DonateForm() {
  const t = useTranslations('Donate');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { designation: 'general', method: 'any', preferredContact: 'whatsapp' },
  });

  async function onSubmit(values: Values) {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, kind: 'pledge' }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-7" />
        </div>
        <p className="text-lg font-medium">{t('formSuccess')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={telHref()}
            className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Phone className="size-4" />
            {t('callLabel')}: <span dir="ltr">{SITE.phone}</span>
          </a>
          <a
            href={whatsappHref(t('waPrefill'))}
            target="_blank"
            rel="noreferrer"
            className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--color-fg)] hover:bg-white/10"
          >
            <WhatsappIcon className="size-4 text-[#25D366]" />
            {t('whatsappLabel')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>{t('formName')}</label>
          <input className={field} aria-label={t('formName')} {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-rose)]">●</p>}
        </div>
        <div>
          <label className={label}>{t('formPhone')}</label>
          <input
            className={field}
            type="tel"
            dir="ltr"
            aria-label={t('formPhone')}
            {...register('phone')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>{t('formEmail')}</label>
          <input className={field} type="email" aria-label={t('formEmail')} {...register('email')} />
        </div>
        <div>
          <label className={label}>{t('formAmount')}</label>
          <input className={field} inputMode="numeric" aria-label={t('formAmount')} {...register('amount')} />
        </div>
      </div>

      {errors.phone && (
        <p className="text-sm text-[var(--color-rose)]">{t('formContactRequired')}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>{t('formDesignation')}</label>
          <select className={field} aria-label={t('formDesignation')} {...register('designation')}>
            <option value="general">{t('optGeneral')}</option>
            <option value="zakat">{t('optZakat')}</option>
            <option value="sponsor-child">{t('optSponsor')}</option>
            <option value="recurring">{t('optRecurring')}</option>
          </select>
        </div>
        <div>
          <label className={label}>{t('formMethod')}</label>
          <select className={field} aria-label={t('formMethod')} {...register('method')}>
            <option value="any">{t('optMethodAny')}</option>
            <option value="bank">{t('optMethodBank')}</option>
            <option value="jazzcash">{t('optMethodJazzcash')}</option>
            <option value="easypaisa">{t('optMethodEasypaisa')}</option>
            <option value="raast">{t('optMethodRaast')}</option>
            <option value="international">{t('optMethodIntl')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>{t('formPreferred')}</label>
        <select className={field} aria-label={t('formPreferred')} {...register('preferredContact')}>
          <option value="phone">{t('optReachPhone')}</option>
          <option value="whatsapp">{t('optReachWhatsapp')}</option>
          <option value="email">{t('optReachEmail')}</option>
        </select>
      </div>

      <div>
        <label className={label}>{t('formMessage')}</label>
        <textarea className={field} rows={3} aria-label={t('formMessage')} {...register('message')} />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-brand inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === 'sending' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4 rtl:-scale-x-100" />
        )}
        {status === 'sending' ? t('formSending') : t('formSend')}
      </button>
      {status === 'error' && (
        <p className="text-sm text-[var(--color-rose)]">{t('formError')}</p>
      )}
    </form>
  );
}
