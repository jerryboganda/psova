'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Check, KeyRound, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/registry/auth-client';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/registry/schemas';
import { FormField } from './FormField';
import { brandButtonClass, fieldClass } from './field';

/** Landing page of the emailed "set your password" link (staff invites and resets). */
export function ResetPasswordForm({ token, tokenError }: { token?: string; tokenError: boolean }) {
  const t = useTranslations('RegistryAuth.reset');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token || tokenError) {
    return (
      <div className="text-center">
        <p className="mb-4 text-[var(--color-muted)]">{t('invalid')}</p>
        <Link href="/registry/login" className="text-sm text-[var(--color-cyan)] hover:underline">
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">{t('doneTitle')}</h2>
        <Link href="/registry/login" className={brandButtonClass}>
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  async function submit(values: ResetPasswordInput) {
    setStatus('sending');
    const { error } = await authClient.resetPassword({ newPassword: values.password, token });
    setStatus(error ? 'error' : 'done');
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <FormField id="rp-password" label={t('password')} hint={t('hint')} required error={errors.password ? t('hint') : undefined}>
        <input id="rp-password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={!!errors.password} aria-describedby="rp-password-error" {...register('password')} />
      </FormField>
      <FormField id="rp-confirm" label={t('confirm')} required error={errors.confirm ? t('mismatch') : undefined}>
        <input id="rp-confirm" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={!!errors.confirm} aria-describedby="rp-confirm-error" {...register('confirm')} />
      </FormField>
      {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      <button type="submit" disabled={status === 'sending'} className={brandButtonClass}>
        {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {t('submit')}
      </button>
    </form>
  );
}
