'use client';

import { useState } from 'react';
import { useForm, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { Pencil } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { centreIntakeSchema, enrollSchema, type EnrollInput } from '@/lib/registry/schemas';
import { formatCnicInput } from '@/lib/registry/normalize';
import {
  GENDERS,
  PROVINCES,
  BODY_SITES,
  ONSETS,
  DOCTOR_DIAGNOSED,
} from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { WizardShell } from './WizardShell';
import { FormField } from './FormField';
import { ConsentCheck } from './ConsentCheck';
import { TrackingCodeCard } from './TrackingCodeCard';
import { fieldClass } from './field';

const STEP_FIELDS: Path<EnrollInput>[][] = [
  ['fullName', 'gender', 'dob', 'guardianName'],
  ['phone', 'altPhone', 'email', 'cnic', 'province', 'district', 'address'],
  ['conditionSlug', 'conditionOther', 'bodySite', 'onset', 'doctorDiagnosed', 'facility', 'treatmentNotes'],
  ['consentRegistry', 'consentCentre', 'consentContact', 'consentResearch', 'consentGuardian'],
];

/** Set when a patient registers through a centre's QR code instead of the national form. */
export type EnrollCentre = { slug: string; name: string; province: string; city: string };

export function EnrollWizard({ centre }: { centre?: EnrollCentre } = {}) {
  const t = useTranslations('RegistryEnroll');
  const ti = useTranslations('Centres.intake');
  const tc = useTranslations('RegistryCommon');
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [done, setDone] = useState<{ code: string; emailProvided: boolean } | null>(null);

  const {
    register,
    trigger,
    getValues,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollInput>({
    // The centre variant differs only in which consent is mandatory; the form shape is the same.
    resolver: zodResolver(centre ? centreIntakeSchema : enrollSchema) as unknown as Resolver<EnrollInput>,
    mode: 'onTouched',
    defaultValues: {
      consentContact: false,
      consentResearch: false,
      consentGuardian: false,
      website: '',
      // The patient's own province/district, preset to the centre's as a convenience.
      ...(centre ? { province: centre.province as EnrollInput['province'], district: centre.city } : {}),
    },
  });

  const conditionSlug = watch('conditionSlug');
  const cnicField = register('cnic');

  const stepLabels = [
    t('steps.patient'),
    t('steps.contact'),
    t('steps.condition'),
    t('steps.consent'),
    t('steps.review'),
  ];
  const stepTitles = [
    t('stepTitles.patient'),
    t('stepTitles.contact'),
    t('stepTitles.condition'),
    t('stepTitles.consent'),
    t('stepTitles.review'),
  ];

  const err = (name: keyof EnrollInput, key: string) =>
    errors[name] ? t(`errors.${key}`) : undefined;

  async function onNext() {
    if (step === 5) {
      await handleSubmit(submit)();
      return;
    }
    const ok = await trigger(STEP_FIELDS[step - 1]);
    if (ok) setStep((s) => s + 1);
  }

  async function submit(values: EnrollInput) {
    setStatus('sending');
    try {
      const res = await fetch(centre ? `/api/centres/intake/${centre.slug}` : '/api/registry/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setDone({ code: data.trackingCode as string, emailProvided: Boolean(values.email) });
    } catch {
      setStatus('error');
    }
  }

  if (done) {
    return <TrackingCodeCard code={done.code} emailProvided={done.emailProvided} />;
  }

  return (
    <WizardShell
      step={step}
      total={5}
      stepTitle={stepTitles[step - 1]}
      stepLabels={stepLabels}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={onNext}
      isLast={step === 5}
      submitting={status === 'sending'}
      submitLabel={t('submit')}
    >
      {/* honeypot */}
      <input type="text" tabIndex={-1} aria-hidden autoComplete="off" className="hidden" {...register('website')} />
      {centre && (
        <p className="mb-6 rounded-2xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 px-4 py-3 text-sm">
          {ti('banner', { name: centre.name })}
        </p>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <FormField id="fullName" label={t('fields.fullName')} required error={err('fullName', 'fullName')}>
            <input id="fullName" className={fieldClass} placeholder={t('fields.fullNamePh')} aria-invalid={!!errors.fullName} aria-describedby="fullName-error" {...register('fullName')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="gender" label={t('fields.gender')} required error={err('gender', 'required')}>
              <select id="gender" className={fieldClass} defaultValue="" aria-invalid={!!errors.gender} {...register('gender')}>
                <option value="" disabled>{tc('select')}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{tc(`genders.${g}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="dob" label={t('fields.dob')} required error={err('dob', 'dob')}>
              <input id="dob" type="date" className={fieldClass} aria-invalid={!!errors.dob} aria-describedby="dob-error" {...register('dob')} />
            </FormField>
          </div>
          <FormField id="guardianName" label={t('fields.guardianName')} hint={t('fields.guardianNameHint')} error={err('guardianName', 'guardian')}>
            <input id="guardianName" className={fieldClass} aria-invalid={!!errors.guardianName} aria-describedby="guardianName-error" {...register('guardianName')} />
          </FormField>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="phone" label={t('fields.phone')} required error={err('phone', 'phone')}>
              <input id="phone" inputMode="tel" dir="ltr" className={fieldClass} placeholder={t('fields.phonePh')} aria-invalid={!!errors.phone} aria-describedby="phone-error" {...register('phone')} />
            </FormField>
            <FormField id="altPhone" label={t('fields.altPhone')} optionalLabel={tc('optional')} error={err('altPhone', 'phone')}>
              <input id="altPhone" inputMode="tel" dir="ltr" className={fieldClass} placeholder={t('fields.phonePh')} aria-invalid={!!errors.altPhone} {...register('altPhone')} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="email" label={t('fields.email')} optionalLabel={tc('optional')} error={err('email', 'email')}>
              <input id="email" type="email" dir="ltr" className={fieldClass} placeholder="name@example.com" aria-invalid={!!errors.email} {...register('email')} />
            </FormField>
            <FormField id="cnic" label={t('fields.cnic')} required hint={t('fields.cnicHint')} error={err('cnic', 'cnic')}>
              <input id="cnic" inputMode="numeric" dir="ltr" maxLength={15} className={fieldClass} placeholder={t('fields.cnicPh')} aria-invalid={!!errors.cnic} aria-describedby="cnic-error" {...cnicField} onChange={(e) => { e.target.value = formatCnicInput(e.target.value); void cnicField.onChange(e); }} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="province" label={t('fields.province')} required error={err('province', 'required')}>
              <select id="province" className={fieldClass} defaultValue="" aria-invalid={!!errors.province} {...register('province')}>
                <option value="" disabled>{tc('select')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{tc(`provinces.${p}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="district" label={t('fields.district')} required error={err('district', 'district')}>
              <input id="district" className={fieldClass} placeholder={t('fields.districtPh')} aria-invalid={!!errors.district} aria-describedby="district-error" {...register('district')} />
            </FormField>
          </div>
          <FormField id="address" label={t('fields.address')} optionalLabel={tc('optional')} error={err('address', 'tooLong')}>
            <input id="address" maxLength={300} className={fieldClass} aria-invalid={!!errors.address} {...register('address')} />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <FormField id="conditionSlug" label={t('fields.condition')} required error={err('conditionSlug', 'condition')}>
            <select id="conditionSlug" className={fieldClass} defaultValue="" aria-invalid={!!errors.conditionSlug} {...register('conditionSlug')}>
              <option value="" disabled>{tc('select')}</option>
              {CONDITIONS.map((c) => (
                <option key={c.slug} value={c.slug}>{localized(c.name, locale)}</option>
              ))}
              <option value="other">{t('conditionOptions.other')}</option>
              <option value="not-sure">{t('conditionOptions.notSure')}</option>
            </select>
          </FormField>
          {conditionSlug === 'other' && (
            <FormField id="conditionOther" label={t('fields.conditionOther')} required error={err('conditionOther', 'conditionOther')}>
              <input id="conditionOther" className={fieldClass} placeholder={t('fields.conditionOtherPh')} aria-invalid={!!errors.conditionOther} aria-describedby="conditionOther-error" {...register('conditionOther')} />
            </FormField>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="bodySite" label={t('fields.bodySite')} required error={err('bodySite', 'bodySite')}>
              <select id="bodySite" className={fieldClass} defaultValue="" aria-invalid={!!errors.bodySite} {...register('bodySite')}>
                <option value="" disabled>{tc('select')}</option>
                {BODY_SITES.map((b) => (
                  <option key={b} value={b}>{tc(`bodySites.${b}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="onset" label={t('fields.onset')} required error={err('onset', 'onset')}>
              <select id="onset" className={fieldClass} defaultValue="" aria-invalid={!!errors.onset} {...register('onset')}>
                <option value="" disabled>{tc('select')}</option>
                {ONSETS.map((o) => (
                  <option key={o} value={o}>{tc(`onsets.${o}`)}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="doctorDiagnosed" label={t('fields.doctorDiagnosed')} required error={err('doctorDiagnosed', 'required')}>
              <select id="doctorDiagnosed" className={fieldClass} defaultValue="" aria-invalid={!!errors.doctorDiagnosed} {...register('doctorDiagnosed')}>
                <option value="" disabled>{tc('select')}</option>
                {DOCTOR_DIAGNOSED.map((d) => (
                  <option key={d} value={d}>{tc(`doctorDiagnosed.${d}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="facility" label={t('fields.facility')} optionalLabel={tc('optional')}>
              <input id="facility" className={fieldClass} {...register('facility')} />
            </FormField>
          </div>
          <FormField id="treatmentNotes" label={t('fields.treatmentNotes')} optionalLabel={tc('optional')} error={err('treatmentNotes', 'tooLong')}>
            <textarea id="treatmentNotes" rows={3} maxLength={2000} className={fieldClass} placeholder={t('fields.treatmentNotesPh')} aria-invalid={!!errors.treatmentNotes} {...register('treatmentNotes')} />
          </FormField>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-muted)]">{t('consentIntro')}</p>
          <Link href="/registry#consent" className="text-sm text-[var(--color-cyan)] hover:underline">
            {t('privacyLink')}
          </Link>
          {centre && (
            <ConsentCheck id="consentCentre" required error={err('consentCentre', 'consentRegistry')} inputProps={register('consentCentre')}>
              {ti('consent.centre', { name: centre.name })}
            </ConsentCheck>
          )}
          <ConsentCheck id="consentRegistry" required={!centre} error={centre ? undefined : err('consentRegistry', 'consentRegistry')} inputProps={register('consentRegistry')}>
            {centre ? ti('consent.registry') : t('consent.registry')}
          </ConsentCheck>
          <ConsentCheck id="consentContact" inputProps={register('consentContact')}>
            {t('consent.contact')}
          </ConsentCheck>
          <ConsentCheck id="consentResearch" inputProps={register('consentResearch')}>
            {t('consent.research')}
          </ConsentCheck>
          <ConsentCheck id="consentGuardian" error={err('consentGuardian', 'consentGuardian')} inputProps={register('consentGuardian')}>
            {t('consent.guardian')}
          </ConsentCheck>
        </div>
      )}

      {step === 5 && <ReviewStep values={getValues()} onEdit={setStep} centre={centre} />}

      {status === 'error' && (
        <p className="mt-4 rounded-2xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 px-4 py-3 text-sm text-[var(--color-rose)]">
          {t('submitError')}
        </p>
      )}
    </WizardShell>
  );
}

function ReviewStep({
  values,
  onEdit,
  centre,
}: {
  values: EnrollInput;
  onEdit: (s: number) => void;
  centre?: EnrollCentre;
}) {
  const t = useTranslations('RegistryEnroll');
  const ti = useTranslations('Centres.intake');
  const tc = useTranslations('RegistryCommon');
  const locale = useLocale();

  const conditionLabel =
    values.conditionSlug === 'other'
      ? values.conditionOther || t('conditionOptions.other')
      : values.conditionSlug === 'not-sure'
        ? t('conditionOptions.notSure')
        : localized(CONDITIONS.find((c) => c.slug === values.conditionSlug)?.name ?? { en: values.conditionSlug, ur: values.conditionSlug }, locale);

  const yn = (b?: boolean) => (b ? t('review.consentYes') : t('review.consentNo'));

  const sections: { key: string; step: number; heading: string; rows: [string, string][] }[] = [
    {
      key: 'patient',
      step: 1,
      heading: t('review.patient'),
      rows: [
        [t('fields.fullName'), values.fullName || '—'],
        [t('fields.gender'), values.gender ? tc(`genders.${values.gender}`) : '—'],
        [t('fields.dob'), values.dob || '—'],
        [t('fields.guardianName'), values.guardianName || '—'],
      ],
    },
    {
      key: 'contact',
      step: 2,
      heading: t('review.contact'),
      rows: [
        [t('fields.phone'), values.phone || '—'],
        [t('fields.cnic'), values.cnic || '—'],
        [t('fields.province'), values.province ? tc(`provinces.${values.province}`) : '—'],
        [t('fields.district'), values.district || '—'],
      ],
    },
    {
      key: 'condition',
      step: 3,
      heading: t('review.condition'),
      rows: [
        [t('fields.condition'), conditionLabel],
        [t('fields.bodySite'), values.bodySite ? tc(`bodySites.${values.bodySite}`) : '—'],
        [t('fields.onset'), values.onset ? tc(`onsets.${values.onset}`) : '—'],
        [t('fields.doctorDiagnosed'), values.doctorDiagnosed ? tc(`doctorDiagnosed.${values.doctorDiagnosed}`) : '—'],
      ],
    },
    {
      key: 'consent',
      step: 4,
      heading: t('review.consent'),
      rows: [
        ...(centre ? ([[ti('consent.centre', { name: centre.name }), yn(values.consentCentre)]] as [string, string][]) : []),
        [centre ? ti('consent.registry') : t('consent.registry'), yn(values.consentRegistry)],
        [t('consent.contact'), yn(values.consentContact)],
        [t('consent.research'), yn(values.consentResearch)],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-muted)]">{t('review.title')}</p>
      {sections.map((s) => (
        <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-fg)]">{s.heading}</h3>
            <button type="button" onClick={() => onEdit(s.step)} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-cyan)] hover:underline">
              <Pencil className="size-3" />
              {t('review.edit')}
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {s.rows.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs text-[var(--color-faint)]">{k}</dt>
                <dd className="break-words text-sm text-[var(--color-fg)]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
