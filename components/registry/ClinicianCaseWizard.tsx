'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import type { z } from 'zod';
import { caseSchema, type CaseInput } from '@/lib/registry/schemas';
import { formatCnicInput } from '@/lib/registry/normalize';

// treatments has a Zod .default([]) so the form *input* type differs from the
// validated *output* type — thread both through useForm's generics.
type CaseForm = z.input<typeof caseSchema>;
import {
  GENDERS,
  PROVINCES,
  BODY_SITES,
  ONSETS,
  ISSVA_CATEGORIES,
  SEVERITIES,
  DIAGNOSIS_BASES,
  TREATMENT_TYPES,
  TREATMENT_OUTCOMES,
} from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { WizardShell } from './WizardShell';
import { FormField } from './FormField';
import { ConsentCheck } from './ConsentCheck';
import { TrackingCodeCard } from './TrackingCodeCard';
import { Link } from '@/i18n/navigation';
import { brandButtonClass, fieldClass } from './field';

const STEP_FIELDS: Path<CaseForm>[][] = [
  ['fullName', 'gender', 'dob', 'guardianName', 'mrn'],
  ['phone', 'altPhone', 'email', 'cnic', 'province', 'district', 'address'],
  ['conditionSlug', 'conditionOther', 'bodySite', 'onset', 'issvaCategory', 'severity', 'basis', 'facility', 'clinicalNotes', 'treatments'],
  ['consentAttested'],
];

/**
 * NVAR clinician case form; also used by centre staff to add a patient to their centre
 * (`endpoint`, preset `defaults`, the centre's own `showMrn` number, an `openHrefBase` link).
 */
export function ClinicianCaseWizard({
  endpoint = '/api/registry/cases',
  defaults,
  showMrn = false,
  showConsent = false,
  openHrefBase,
}: {
  endpoint?: string;
  defaults?: Partial<CaseForm>;
  showMrn?: boolean;
  /** Centre add-patient flow: capture contact/research consent. */
  showConsent?: boolean;
  /** After saving, link to `${openHrefBase}/${patientId}`. */
  openHrefBase?: string;
} = {}) {
  const t = useTranslations('RegistryClinician');
  const tp = useTranslations('Centres.patients');
  const te = useTranslations('RegistryEnroll');
  const tc = useTranslations('RegistryCommon');
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'conflict'>('idle');
  const [done, setDone] = useState<{ code: string; id: string } | null>(null);

  const {
    register,
    control,
    trigger,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CaseForm, unknown, CaseInput>({
    resolver: zodResolver(caseSchema),
    mode: 'onTouched',
    defaultValues: { treatments: [], ...defaults },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'treatments' });
  const conditionSlug = watch('conditionSlug');
  const cnicField = register('cnic');

  const stepLabels = [t('steps.patient'), t('steps.contact'), t('steps.clinical'), t('steps.attestation')];
  const stepTitles = [t('stepTitles.patient'), t('stepTitles.contact'), t('stepTitles.clinical'), t('stepTitles.attestation')];

  const eErr = (name: keyof CaseForm, key: string) => (errors[name] ? te(`errors.${key}`) : undefined);

  async function onNext() {
    if (step === 4) {
      await handleSubmit(submit)();
      return;
    }
    const ok = await trigger(STEP_FIELDS[step - 1]);
    if (ok) setStep((s) => s + 1);
  }

  async function submit(values: CaseInput) {
    setStatus('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setStatus('conflict');
        return;
      }
      if (!res.ok || !data?.ok) throw new Error();
      setDone({ code: data.trackingCode as string, id: (data.patientId as string) ?? '' });
    } catch {
      setStatus('error');
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <TrackingCodeCard code={done.code} note={t('successNote')} />
        {openHrefBase && done.id && (
          <Link href={`${openHrefBase}/${done.id}`} className={brandButtonClass + ' mx-auto'}>
            {tp('openPatient')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <WizardShell
      step={step}
      total={4}
      stepTitle={stepTitles[step - 1]}
      stepLabels={stepLabels}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={onNext}
      isLast={step === 4}
      submitting={status === 'sending'}
      submitLabel={t('submit')}
    >
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <FormField id="c-fullName" label={te('fields.fullName')} required error={eErr('fullName', 'fullName')}>
            <input id="c-fullName" className={fieldClass} aria-invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-gender" label={te('fields.gender')} required error={eErr('gender', 'required')}>
              <select id="c-gender" className={fieldClass} defaultValue="" aria-invalid={!!errors.gender} {...register('gender')}>
                <option value="" disabled>{tc('select')}</option>
                {GENDERS.map((g) => <option key={g} value={g}>{tc(`genders.${g}`)}</option>)}
              </select>
            </FormField>
            <FormField id="c-dob" label={te('fields.dob')} required error={eErr('dob', 'dob')}>
              <input id="c-dob" type="date" className={fieldClass} aria-invalid={!!errors.dob} {...register('dob')} />
            </FormField>
          </div>
          <FormField id="c-guardianName" label={te('fields.guardianName')} hint={te('fields.guardianNameHint')} error={eErr('guardianName', 'guardian')}>
            <input id="c-guardianName" className={fieldClass} aria-invalid={!!errors.guardianName} {...register('guardianName')} />
          </FormField>
          {showMrn && (
            <FormField id="c-mrn" label={tp('mrn')} optionalLabel={tc('optional')} hint={tp('mrnHint')}>
              <input id="c-mrn" dir="ltr" className={fieldClass} {...register('mrn')} />
            </FormField>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-phone" label={te('fields.phone')} required error={eErr('phone', 'phone')}>
              <input id="c-phone" dir="ltr" inputMode="tel" className={fieldClass} placeholder={te('fields.phonePh')} aria-invalid={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField id="c-altPhone" label={te('fields.altPhone')} optionalLabel={tc('optional')} error={eErr('altPhone', 'phone')}>
              <input id="c-altPhone" dir="ltr" inputMode="tel" className={fieldClass} {...register('altPhone')} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-email" label={te('fields.email')} optionalLabel={tc('optional')} error={eErr('email', 'email')}>
              <input id="c-email" type="email" dir="ltr" className={fieldClass} aria-invalid={!!errors.email} {...register('email')} />
            </FormField>
            <FormField id="c-cnic" label={te('fields.cnic')} required hint={te('fields.cnicHint')} error={eErr('cnic', 'cnic')}>
              <input id="c-cnic" dir="ltr" inputMode="numeric" maxLength={15} className={fieldClass} placeholder={te('fields.cnicPh')} aria-invalid={!!errors.cnic} {...cnicField} onChange={(e) => { e.target.value = formatCnicInput(e.target.value); void cnicField.onChange(e); }} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-province" label={te('fields.province')} required error={eErr('province', 'required')}>
              <select id="c-province" className={fieldClass} defaultValue="" aria-invalid={!!errors.province} {...register('province')}>
                <option value="" disabled>{tc('select')}</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{tc(`provinces.${p}`)}</option>)}
              </select>
            </FormField>
            <FormField id="c-district" label={te('fields.district')} required error={eErr('district', 'district')}>
              <input id="c-district" className={fieldClass} placeholder={te('fields.districtPh')} aria-invalid={!!errors.district} {...register('district')} />
            </FormField>
          </div>
          <FormField id="c-address" label={te('fields.address')} optionalLabel={tc('optional')}>
            <input id="c-address" className={fieldClass} {...register('address')} />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-condition" label={te('fields.condition')} required error={eErr('conditionSlug', 'condition')}>
              <select id="c-condition" className={fieldClass} defaultValue="" aria-invalid={!!errors.conditionSlug} {...register('conditionSlug')}>
                <option value="" disabled>{tc('select')}</option>
                {CONDITIONS.map((c) => <option key={c.slug} value={c.slug}>{localized(c.name, locale)}</option>)}
                <option value="other">{te('conditionOptions.other')}</option>
                <option value="not-sure">{te('conditionOptions.notSure')}</option>
              </select>
            </FormField>
            <FormField id="c-bodySite" label={te('fields.bodySite')} required error={eErr('bodySite', 'bodySite')}>
              <select id="c-bodySite" className={fieldClass} defaultValue="" aria-invalid={!!errors.bodySite} {...register('bodySite')}>
                <option value="" disabled>{tc('select')}</option>
                {BODY_SITES.map((b) => <option key={b} value={b}>{tc(`bodySites.${b}`)}</option>)}
              </select>
            </FormField>
          </div>
          {conditionSlug === 'other' && (
            <FormField id="c-conditionOther" label={te('fields.conditionOther')} required error={eErr('conditionOther', 'conditionOther')}>
              <input id="c-conditionOther" className={fieldClass} aria-invalid={!!errors.conditionOther} {...register('conditionOther')} />
            </FormField>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-onset" label={te('fields.onset')} required error={eErr('onset', 'onset')}>
              <select id="c-onset" className={fieldClass} defaultValue="" aria-invalid={!!errors.onset} {...register('onset')}>
                <option value="" disabled>{tc('select')}</option>
                {ONSETS.map((o) => <option key={o} value={o}>{tc(`onsets.${o}`)}</option>)}
              </select>
            </FormField>
            <FormField id="c-issva" label={t('fields.issva')} required error={errors.issvaCategory ? t('errors.required') : undefined}>
              <select id="c-issva" className={fieldClass} defaultValue="" aria-invalid={!!errors.issvaCategory} {...register('issvaCategory')}>
                <option value="" disabled>{tc('select')}</option>
                {ISSVA_CATEGORIES.map((c) => <option key={c} value={c}>{tc(`issva.${c}`)}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="c-severity" label={t('fields.severity')} required error={errors.severity ? t('errors.required') : undefined}>
              <select id="c-severity" className={fieldClass} defaultValue="" aria-invalid={!!errors.severity} {...register('severity')}>
                <option value="" disabled>{tc('select')}</option>
                {SEVERITIES.map((s) => <option key={s} value={s}>{tc(`severity.${s}`)}</option>)}
              </select>
            </FormField>
            <FormField id="c-basis" label={t('fields.basis')} required error={errors.basis ? t('errors.required') : undefined}>
              <select id="c-basis" className={fieldClass} defaultValue="" aria-invalid={!!errors.basis} {...register('basis')}>
                <option value="" disabled>{tc('select')}</option>
                {DIAGNOSIS_BASES.map((b) => <option key={b} value={b}>{tc(`basis.${b}`)}</option>)}
              </select>
            </FormField>
          </div>
          <FormField id="c-facility" label={t('fields.diagnosingFacility')} optionalLabel={tc('optional')}>
            <input id="c-facility" className={fieldClass} {...register('facility')} />
          </FormField>
          <FormField id="c-notes" label={t('fields.clinicalNotes')} optionalLabel={tc('optional')}>
            <textarea id="c-notes" rows={3} className={fieldClass} placeholder={t('fields.clinicalNotesPh')} {...register('clinicalNotes')} />
          </FormField>

          {/* treatments repeater */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t('treatments.heading')}</h3>
              <button
                type="button"
                onClick={() => append({ type: 'OBSERVATION', outcome: 'UNKNOWN' })}
                disabled={fields.length >= 10}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] hover:bg-white/10 disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                {t('treatments.add')}
              </button>
            </div>
            {fields.length === 0 ? (
              <p className="text-sm text-[var(--color-faint)]">{t('treatments.none')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {fields.map((f, i) => (
                  <div key={f.id} className="grid items-end gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:grid-cols-[1fr_1fr_auto_1fr_auto]">
                    <select className={fieldClass} {...register(`treatments.${i}.type` as const)}>
                      {TREATMENT_TYPES.map((tt) => <option key={tt} value={tt}>{tc(`treatmentTypes.${tt}`)}</option>)}
                    </select>
                    <input className={fieldClass} placeholder={t('treatments.facility')} {...register(`treatments.${i}.facility` as const)} />
                    <input
                      className={`${fieldClass} w-24`}
                      inputMode="numeric"
                      min={1900}
                      max={new Date().getFullYear()}
                      placeholder={t('treatments.year')}
                      aria-invalid={!!errors.treatments?.[i]?.year}
                      {...register(`treatments.${i}.year` as const, { setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)) })}
                    />
                    <select className={fieldClass} {...register(`treatments.${i}.outcome` as const)}>
                      {TREATMENT_OUTCOMES.map((o) => <option key={o} value={o}>{tc(`outcomes.${o}`)}</option>)}
                    </select>
                    <button type="button" onClick={() => remove(i)} aria-label={t('treatments.remove')} className="grid size-10 place-items-center rounded-full text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10">
                      <Trash2 className="size-4" />
                    </button>
                    {errors.treatments?.[i]?.year && (
                      <p className="text-xs text-[var(--color-rose)] sm:col-span-5">{t('errors.treatmentYear')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold">{t('attestation.heading')}</h3>
          <ConsentCheck id="c-attest" required error={errors.consentAttested ? t('errors.attestation') : undefined} inputProps={register('consentAttested')}>
            {t('attestation.text')}
          </ConsentCheck>
          {showConsent && (
            <>
              <ConsentCheck id="c-consent-contact" inputProps={register('consentContact')}>
                {tp('consentContact')}
              </ConsentCheck>
              <ConsentCheck id="c-consent-research" inputProps={register('consentResearch')}>
                {tp('consentResearch')}
              </ConsentCheck>
            </>
          )}
        </div>
      )}

      {(status === 'error' || status === 'conflict') && (
        <p className="mt-4 rounded-2xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 px-4 py-3 text-sm text-[var(--color-rose)]">
          {status === 'conflict' ? tp('mrnTaken') : t('submitError')}
        </p>
      )}
    </WizardShell>
  );
}
