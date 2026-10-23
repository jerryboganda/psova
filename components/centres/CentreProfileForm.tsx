'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Save } from 'lucide-react';
import { centerProfileSchema, type CenterProfileInput } from '@/lib/registry/schemas';
import { CENTER_SERVICES } from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { FormField } from '@/components/registry/FormField';
import { brandButtonClass, fieldClass } from '@/components/registry/field';

const chipClass =
  'flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-muted)] transition-colors hover:border-white/20 has-[:checked]:border-[var(--color-cyan)]/50 has-[:checked]:bg-[var(--color-cyan)]/10 has-[:checked]:text-[var(--color-fg)]';

export function CentreProfileForm({ initial }: { initial: CenterProfileInput }) {
  const t = useTranslations('Centres.profileEdit');
  const ta = useTranslations('Centres.apply');
  const ts = useTranslations('Centres.services');
  const tc = useTranslations('RegistryCommon');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CenterProfileInput>({ resolver: zodResolver(centerProfileSchema), defaultValues: initial });

  async function save(values: CenterProfileInput) {
    setStatus('saving');
    try {
      const res = await fetch('/api/centre/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const err = (has: unknown) => (has ? ta('errors.invalid') : undefined);

  return (
    <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-6">
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">{t('locked')}</p>

      <FormField id="nameUr" label={ta('f.nameUr')} optionalLabel={tc('optional')}>
        <input id="nameUr" dir="rtl" className={fieldClass} {...register('nameUr')} />
      </FormField>
      <FormField id="address" label={ta('f.address')} required error={err(errors.address)}>
        <textarea id="address" rows={3} className={fieldClass} aria-invalid={!!errors.address} aria-describedby="address-error" {...register('address')} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="phone" label={ta('f.phone')} required error={err(errors.phone)}>
          <input id="phone" type="tel" dir="ltr" className={fieldClass} aria-invalid={!!errors.phone} aria-describedby="phone-error" {...register('phone')} />
        </FormField>
        <FormField id="contactEmail" label={ta('f.contactEmail')} required error={err(errors.contactEmail)}>
          <input id="contactEmail" type="email" dir="ltr" className={fieldClass} aria-invalid={!!errors.contactEmail} aria-describedby="contactEmail-error" {...register('contactEmail')} />
        </FormField>
      </div>
      <FormField id="websiteUrl" label={ta('f.websiteUrl')} optionalLabel={tc('optional')} error={err(errors.websiteUrl)}>
        <input id="websiteUrl" type="url" dir="ltr" placeholder="https://" className={fieldClass} aria-invalid={!!errors.websiteUrl} aria-describedby="websiteUrl-error" {...register('websiteUrl')} />
      </FormField>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--color-muted)]">{ta('f.services')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CENTER_SERVICES.map((s) => (
            <label key={s} className={chipClass}>
              <input type="checkbox" value={s} className="size-4 accent-[var(--color-cyan)]" {...register('services')} />
              {ts(s)}
            </label>
          ))}
        </div>
        {errors.services && <p role="alert" className="mt-1 text-xs text-[var(--color-rose)]">{ta('errors.choose')}</p>}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--color-muted)]">{ta('f.conditions')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONDITIONS.map((c) => (
            <label key={c.slug} className={chipClass}>
              <input type="checkbox" value={c.slug} className="size-4 accent-[var(--color-cyan)]" {...register('conditions')} />
              {localized(c.name, locale)}
            </label>
          ))}
        </div>
        {errors.conditions && <p role="alert" className="mt-1 text-xs text-[var(--color-rose)]">{ta('errors.choose')}</p>}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'saving'} className={brandButtonClass}>
          {status === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {status === 'saving' ? t('saving') : t('save')}
        </button>
        {status === 'saved' && <p role="status" className="text-sm text-[var(--color-cyan)]">{t('saved')}</p>}
        {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}
