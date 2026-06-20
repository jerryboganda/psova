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
  childAge: z.string().optional(),
  question: z.string().min(5),
  consent: z.literal(true),
});
type Values = z.infer<typeof schema>;

const field =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--color-faint)] transition-colors focus:border-[var(--color-cyan)]/60 focus:outline-none';

export function AskExpertForm() {
  const t = useTranslations('AskExpert');
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
        body: JSON.stringify({
          kind: 'ask-expert',
          name: values.name,
          email: values.email,
          childAge: values.childAge,
          message: values.question,
        }),
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
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-8 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-6" />
        </div>
        <p className="font-medium">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={field} aria-label={t('name')} placeholder={t('name')} {...register('name')} />
        <input className={field} aria-label={t('email')} placeholder={t('email')} type="email" {...register('email')} />
      </div>
      <input className={field} aria-label={t('childAge')} placeholder={t('childAge')} {...register('childAge')} />
      <textarea className={field} aria-label={t('question')} rows={4} placeholder={t('question')} {...register('question')} />
      <label className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
        <input type="checkbox" className="mt-1 size-4 accent-[var(--color-magenta)]" {...register('consent')} />
        <span>{t('consent')}</span>
      </label>
      {errors.consent && <p className="text-xs text-[var(--color-rose)]">●</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-brand inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:-scale-x-100" />}
        {t('send')}
      </button>
      {status === 'error' && <p className="text-sm text-[var(--color-rose)]">●</p>}
    </form>
  );
}
