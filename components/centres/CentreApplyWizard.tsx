'use client';

import { useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { centerApplySchema, type CenterApplyInput } from '@/lib/registry/schemas';
import {
  CENTER_PAYMENT_METHODS,
  CENTER_SERVICES,
  CENTER_TYPES,
  PROVINCES,
} from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { WizardShell } from '@/components/registry/WizardShell';
import { FormField } from '@/components/registry/FormField';
import { ConsentCheck } from '@/components/registry/ConsentCheck';
import { fieldClass, brandButtonClass } from '@/components/registry/field';

const BASE_STEP4: Path<CenterApplyInput>[] = ['ownerName', 'email', 'password', 'consentTerms'];
const STEP_FIELDS: Path<CenterApplyInput>[][] = [
  ['nameEn', 'nameUr', 'type', 'licenceNumber', 'headDoctorName', 'headDoctorPmc'],
  ['city', 'province', 'address', 'phone', 'contactEmail', 'websiteUrl'],
  ['services', 'conditions'],
  BASE_STEP4,
];

const chipClass =
  'flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-muted)] transition-colors hover:border-white/20 has-[:checked]:border-[var(--color-cyan)]/50 has-[:checked]:bg-[var(--color-cyan)]/10 has-[:checked]:text-[var(--color-fg)]';

export function CentreApplyWizard() {
  const t = useTranslations('Centres.apply');
  const tc = useTranslations('RegistryCommon');
  const ts = useTranslations('Centres.services');
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [payNow, setPayNow] = useState(false);

  const {
    register,
    trigger,
    unregister,
    handleSubmit,
    formState: { errors },
  } = useForm<CenterApplyInput>({
    resolver: zodResolver(centerApplySchema),
    mode: 'onTouched',
    defaultValues: { services: [], conditions: [], website: '' },
  });

  const err = (has: unknown, key = 'invalid') => (has ? t(`errors.${key}`) : undefined);
  const labels = (group: 'steps' | 'stepTitles') =>
    (['details', 'location', 'care', 'account'] as const).map((k) => t(`${group}.${k}`));

  async function onNext() {
    if (step === 4) {
      await handleSubmit(submit)();
      return;
    }
    if (await trigger(STEP_FIELDS[step - 1])) setStep((s) => s + 1);
  }

  async function submit(values: CenterApplyInput) {
    setStatus('sending');
    try {
      const res = await fetch('/api/centres/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  function togglePayNow(on: boolean) {
    setPayNow(on);
    if (!on) unregister('payment');
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-10 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
          <Check className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">{t('successTitle')}</h3>
        <p className="text-sm text-[var(--color-muted)]">{t('successBody')}</p>
        <Link href="/registry/login" className={brandButtonClass}>
          {t('signIn')}
        </Link>
      </div>
    );
  }

  return (
    <WizardShell
      step={step}
      total={4}
      stepTitle={labels('stepTitles')[step - 1]}
      stepLabels={labels('steps')}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={onNext}
      isLast={step === 4}
      submitting={status === 'sending'}
      submitLabel={status === 'sending' ? t('submitting') : t('submit')}
    >
      {/* honeypot */}
      <input type="text" tabIndex={-1} aria-hidden autoComplete="off" className="hidden" {...register('website')} />

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="nameEn" label={t('f.nameEn')} required error={err(errors.nameEn)}>
              <input id="nameEn" className={fieldClass} aria-invalid={!!errors.nameEn} aria-describedby="nameEn-error" {...register('nameEn')} />
            </FormField>
            <FormField id="nameUr" label={t('f.nameUr')} optionalLabel={tc('optional')}>
              <input id="nameUr" dir="rtl" className={fieldClass} {...register('nameUr')} />
            </FormField>
          </div>
          <FormField id="type" label={t('f.type')} required error={err(errors.type)}>
            <select id="type" className={fieldClass} defaultValue="" aria-invalid={!!errors.type} aria-describedby="type-error" {...register('type')}>
              <option value="" disabled>{tc('select')}</option>
              {CENTER_TYPES.map((v) => (
                <option key={v} value={v}>{t(`types.${v}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField id="licenceNumber" label={t('f.licenceNumber')} hint={t('f.licenceHint')} required error={err(errors.licenceNumber)}>
            <input id="licenceNumber" dir="ltr" className={fieldClass} aria-invalid={!!errors.licenceNumber} aria-describedby="licenceNumber-error" {...register('licenceNumber')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="headDoctorName" label={t('f.headDoctorName')} required error={err(errors.headDoctorName)}>
              <input id="headDoctorName" className={fieldClass} aria-invalid={!!errors.headDoctorName} aria-describedby="headDoctorName-error" {...register('headDoctorName')} />
            </FormField>
            <FormField id="headDoctorPmc" label={t('f.headDoctorPmc')} required error={err(errors.headDoctorPmc)}>
              <input id="headDoctorPmc" dir="ltr" className={fieldClass} aria-invalid={!!errors.headDoctorPmc} aria-describedby="headDoctorPmc-error" {...register('headDoctorPmc')} />
            </FormField>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="city" label={t('f.city')} required error={err(errors.city)}>
              <input id="city" className={fieldClass} aria-invalid={!!errors.city} aria-describedby="city-error" {...register('city')} />
            </FormField>
            <FormField id="province" label={t('f.province')} required error={err(errors.province)}>
              <select id="province" className={fieldClass} defaultValue="" aria-invalid={!!errors.province} aria-describedby="province-error" {...register('province')}>
                <option value="" disabled>{tc('select')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{tc(`provinces.${p}`)}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField id="address" label={t('f.address')} required error={err(errors.address)}>
            <textarea id="address" rows={3} className={fieldClass} aria-invalid={!!errors.address} aria-describedby="address-error" {...register('address')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="phone" label={t('f.phone')} required error={err(errors.phone)}>
              <input id="phone" type="tel" dir="ltr" autoComplete="tel" className={fieldClass} aria-invalid={!!errors.phone} aria-describedby="phone-error" {...register('phone')} />
            </FormField>
            <FormField id="contactEmail" label={t('f.contactEmail')} required error={err(errors.contactEmail)}>
              <input id="contactEmail" type="email" dir="ltr" className={fieldClass} aria-invalid={!!errors.contactEmail} aria-describedby="contactEmail-error" {...register('contactEmail')} />
            </FormField>
          </div>
          <FormField id="websiteUrl" label={t('f.websiteUrl')} optionalLabel={tc('optional')} error={err(errors.websiteUrl)}>
            <input id="websiteUrl" type="url" dir="ltr" placeholder="https://" className={fieldClass} aria-invalid={!!errors.websiteUrl} aria-describedby="websiteUrl-error" {...register('websiteUrl')} />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--color-muted)]">
              {t('f.services')} <span className="text-[var(--color-rose)]">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CENTER_SERVICES.map((s) => (
                <label key={s} className={chipClass}>
                  <input type="checkbox" value={s} className="size-4 accent-[var(--color-cyan)]" {...register('services')} />
                  {ts(s)}
                </label>
              ))}
            </div>
            {errors.services && <p role="alert" className="mt-1 text-xs text-[var(--color-rose)]">{t('errors.choose')}</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--color-muted)]">
              {t('f.conditions')} <span className="text-[var(--color-rose)]">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <label key={c.slug} className={chipClass}>
                  <input type="checkbox" value={c.slug} className="size-4 accent-[var(--color-cyan)]" {...register('conditions')} />
                  {localized(c.name, locale)}
                </label>
              ))}
            </div>
            {errors.conditions && <p role="alert" className="mt-1 text-xs text-[var(--color-rose)]">{t('errors.choose')}</p>}
          </fieldset>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <FormField id="ownerName" label={t('f.ownerName')} required error={err(errors.ownerName)}>
            <input id="ownerName" autoComplete="name" className={fieldClass} aria-invalid={!!errors.ownerName} aria-describedby="ownerName-error" {...register('ownerName')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="email" label={t('f.email')} required error={err(errors.email)}>
              <input id="email" type="email" dir="ltr" autoComplete="email" className={fieldClass} aria-invalid={!!errors.email} aria-describedby="email-error" {...register('email')} />
            </FormField>
            <FormField id="password" label={t('f.password')} hint={t('f.passwordHint')} required error={err(errors.password)}>
              <input id="password" type="password" autoComplete="new-password" className={fieldClass} aria-invalid={!!errors.password} aria-describedby="password-error" {...register('password')} />
            </FormField>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-1 text-sm font-semibold">{t('payment.title')}</h3>
            <p className="mb-3 text-sm text-[var(--color-muted)]">{t('payment.note')}</p>
            <Link href="/donate" className="mb-3 inline-block text-sm text-[var(--color-cyan)] hover:underline">
              {t('payment.donateLink')}
            </Link>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={payNow} onChange={(e) => togglePayNow(e.target.checked)} className="size-4 accent-[var(--color-cyan)]" />
              {t('payment.payNow')}
            </label>
            {payNow && (
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                <FormField id="pay-method" label={t('payment.method')} required error={err(errors.payment?.method)}>
                  <select id="pay-method" className={fieldClass} defaultValue="" {...register('payment.method')}>
                    <option value="" disabled>{tc('select')}</option>
                    {CENTER_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{t(`payment.methods.${m}`)}</option>
                    ))}
                  </select>
                </FormField>
                <FormField id="pay-txn" label={t('payment.txnRef')} required error={err(errors.payment?.txnRef)}>
                  <input id="pay-txn" dir="ltr" className={fieldClass} {...register('payment.txnRef')} />
                </FormField>
                <FormField id="pay-date" label={t('payment.paidOn')} required error={err(errors.payment?.paidOn)}>
                  <input id="pay-date" type="date" className={fieldClass} {...register('payment.paidOn')} />
                </FormField>
              </div>
            )}
          </div>

          <ConsentCheck id="consentTerms" required error={err(errors.consentTerms, 'consent')} inputProps={register('consentTerms')}>
            {t('consent')}
          </ConsentCheck>
          {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
        </div>
      )}
    </WizardShell>
  );
}
