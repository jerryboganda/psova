'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(5),
});
type Values = z.infer<typeof schema>;

const field =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--color-faint)] transition-colors focus:border-[var(--color-cyan)]/60 focus:outline-none';

export function ContactForm() {
  const t = useTranslations('Contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, kind: 'contact' }),
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
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-10 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-7" />
        </div>
        <p className="text-lg font-medium">{t('formSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input className={field} aria-label={t('formName')} placeholder={t('formName')} {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-rose)]">●</p>}
        </div>
        <div>
          <input className={field} aria-label={t('formEmail')} placeholder={t('formEmail')} type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-rose)]">●</p>}
        </div>
      </div>
      <input className={field} aria-label={t('formSubject')} placeholder={t('formSubject')} {...register('subject')} />
      <textarea className={field} aria-label={t('formMessage')} rows={5} placeholder={t('formMessage')} {...register('message')} />
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
