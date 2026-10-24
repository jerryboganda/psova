'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { CENTRE_TIME_ZONE } from '@/lib/registry/constants';
import { Search, Loader2, Info, Phone, Mail } from 'lucide-react';
import { statusSchema, type StatusInput } from '@/lib/registry/schemas';
import { SITE } from '@/data/site';
import { Link } from '@/i18n/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { RegistryBadge } from './RegistryBadge';
import { FormField } from './FormField';
import { fieldClass, brandButtonClass, errorClass } from './field';

type Result = {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CENTRE';
  submittedAt: string;
  firstName: string;
  publicReason?: string;
  centre?: { en: string; ur: string };
  nextAppointment?: { startsAt: string; kind: string };
};

export function StatusLookup() {
  const t = useTranslations('RegistryStatus');
  const ta = useTranslations('Centres.appointments');
  const format = useFormatter();
  const locale = useLocale();
  const [state, setState] = useState<'idle' | 'checking' | 'notfound' | 'ratelimited' | 'error'>('idle');
  const [result, setResult] = useState<Result | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusInput>({ resolver: zodResolver(statusSchema) });

  async function onSubmit(values: StatusInput) {
    setState('checking');
    setResult(null);
    try {
      const res = await fetch('/api/registry/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.status === 404) {
        setState('notfound');
        return;
      }
      if (res.status === 429) {
        setState('ratelimited');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setResult(data as Result);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <GlassCard interactive={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <FormField id="trackingCode" label={t('codeLabel')} required error={errors.trackingCode ? t('requiredCode') : undefined}>
            <input
              id="trackingCode"
              dir="ltr"
              className={fieldClass}
              placeholder={t('codePlaceholder')}
              autoComplete="off"
              {...register('trackingCode')}
            />
          </FormField>
          <FormField id="statusPhone" label={t('phoneLabel')} required error={errors.phone ? t('requiredPhone') : undefined}>
            <input
              id="statusPhone"
              dir="ltr"
              inputMode="tel"
              className={fieldClass}
              placeholder={t('phonePlaceholder')}
              autoComplete="off"
              {...register('phone')}
            />
          </FormField>
          <button type="submit" disabled={state === 'checking'} className={brandButtonClass}>
            {state === 'checking' ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {state === 'checking' ? t('checking') : t('check')}
          </button>
          {(state === 'notfound' || state === 'error' || state === 'ratelimited') && (
            <p role="alert" className={errorClass}>
              {state === 'ratelimited' ? t('rateLimited') : state === 'error' ? t('error') : t('notFound')}
            </p>
          )}
        </form>
      </GlassCard>

      {result && (
        <GlassCard interactive={false} className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <RegistryBadge status={result.status} label={t(`status.${result.status}`)} />
            <span className="text-sm text-[var(--color-muted)]">
              {t('submittedOn')}: {format.dateTime(new Date(result.submittedAt), { dateStyle: 'long' })}
            </span>
          </div>
          <dl className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <dt className="text-sm text-[var(--color-faint)]">{t('firstNameLabel')}:</dt>
              <dd className="text-sm font-medium text-[var(--color-fg)]">{result.firstName}</dd>
            </div>
            {result.nextAppointment && (
              <div className="flex items-baseline gap-2">
                <dt className="text-sm text-[var(--color-faint)]">{t('nextAppointment')}:</dt>
                <dd className="text-sm font-medium text-[var(--color-fg)]">
                  {format.dateTime(new Date(result.nextAppointment.startsAt), { dateStyle: 'medium', timeStyle: 'short', timeZone: CENTRE_TIME_ZONE })}
                  {' · '}
                  {ta(`kinds.${result.nextAppointment.kind}`)}
                </dd>
              </div>
            )}
            {result.centre && (
              <div className="flex items-baseline gap-2">
                <dt className="text-sm text-[var(--color-faint)]">{t('centreLabel')}:</dt>
                <dd className="text-sm font-medium text-[var(--color-fg)]">{locale === 'ur' ? result.centre.ur : result.centre.en}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-sm text-[var(--color-muted)]">{t(`statusHelp.${result.status}`)}</p>
          {result.status === 'REJECTED' && result.publicReason && (
            <div className="mt-4 rounded-2xl border border-[var(--color-rose)]/25 bg-[var(--color-rose)]/5 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-rose)]">{t('reasonLabel')}</p>
              <p className="text-sm text-[var(--color-fg)]">{result.publicReason}</p>
            </div>
          )}
          {result.status === 'REJECTED' && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-sm text-[var(--color-muted)]">{t('rejectedHelp')}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-[var(--color-cyan)] hover:underline">
                  <Phone className="size-4" /> {SITE.phone}
                </a>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-1.5 text-[var(--color-cyan)] hover:underline">
                  <Mail className="size-4" /> {SITE.email}
                </a>
                <Link href="/registry/enroll" className="font-semibold text-[var(--color-cyan)] hover:underline">
                  {t('enrollAgain')}
                </Link>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      <p className="mt-6 flex items-start gap-2 text-sm text-[var(--color-faint)]">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t('help')}
      </p>
    </div>
  );
}
