'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { encounterCreateSchema, type EncounterCreateInput } from '@/lib/registry/schemas';
import { RESPONSE_SCORES, TREATMENT_OUTCOMES, TREATMENT_TYPES, CENTRE_TIME_ZONE } from '@/lib/registry/constants';
import { FormField } from '@/components/registry/FormField';
import { brandButtonClass, fieldClass } from '@/components/registry/field';

// Empty inputs must become "absent", not '' or NaN, for the optional fields.
const num = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined);

/** Record a visit: findings, optional plan + treatment (doctor/owner), and a review date that auto-books a follow-up. */
export function VisitForm({ patientId, canPlan }: { patientId: string; canPlan: boolean }) {
  const t = useTranslations('Centres.visit');
  const tc = useTranslations('RegistryCommon');
  const router = useRouter();
  const [withTreatment, setWithTreatment] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    unregister,
    formState: { errors },
  } = useForm<EncounterCreateInput>({
    resolver: zodResolver(encounterCreateSchema),
    defaultValues: { date: new Date().toLocaleDateString('en-CA', { timeZone: CENTRE_TIME_ZONE }) },
  });

  async function submit(values: EncounterCreateInput) {
    setStatus('sending');
    try {
      const res = await fetch(`/api/centre/patients/${patientId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      router.push(`/centre/patients/${patientId}`);
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  const err = (has: unknown) => (has ? t('invalid') : undefined);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="v-date" label={t('date')} required error={err(errors.date)}>
          <input id="v-date" type="date" className={fieldClass} aria-invalid={!!errors.date} aria-describedby="v-date-error" {...register('date')} />
        </FormField>
        <FormField id="v-response" label={t('response')} optionalLabel={tc('optional')}>
          <select id="v-response" className={fieldClass} defaultValue="" {...register('responseScore', { setValueAs: str })}>
            <option value="">{tc('select')}</option>
            {RESPONSE_SCORES.map((r) => (
              <option key={r} value={r}>{t(`responses.${r}`)}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="v-size" label={t('size')} optionalLabel={tc('optional')} error={err(errors.lesionSizeCm)}>
          <input id="v-size" type="number" step="0.1" min={0} max={200} inputMode="decimal" dir="ltr" className={fieldClass} {...register('lesionSizeCm', { setValueAs: num })} />
        </FormField>
        <FormField id="v-pain" label={t('pain')} optionalLabel={tc('optional')} error={err(errors.painScore)}>
          <input id="v-pain" type="number" step="1" min={0} max={10} inputMode="numeric" dir="ltr" className={fieldClass} {...register('painScore', { setValueAs: num })} />
        </FormField>
      </div>

      <FormField id="v-notes" label={t('notes')} optionalLabel={tc('optional')}>
        <textarea id="v-notes" rows={4} className={fieldClass} {...register('notes')} />
      </FormField>

      {canPlan && (
        <>
          <FormField id="v-plan" label={t('plan')} optionalLabel={tc('optional')}>
            <textarea id="v-plan" rows={3} className={fieldClass} {...register('plan')} />
          </FormField>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={withTreatment}
                onChange={(e) => {
                  setWithTreatment(e.target.checked);
                  if (!e.target.checked) unregister('treatment');
                }}
                className="size-4 accent-[var(--color-cyan)]"
              />
              {t('treatmentToggle')}
            </label>
            {withTreatment && (
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormField id="v-ttype" label={t('treatmentType')} required error={err(errors.treatment?.type)}>
                  <select id="v-ttype" className={fieldClass} defaultValue="" {...register('treatment.type')}>
                    <option value="" disabled>{tc('select')}</option>
                    {TREATMENT_TYPES.map((x) => (
                      <option key={x} value={x}>{tc(`treatmentTypes.${x}`)}</option>
                    ))}
                  </select>
                </FormField>
                <FormField id="v-toutcome" label={t('treatmentOutcome')} required error={err(errors.treatment?.outcome)}>
                  <select id="v-toutcome" className={fieldClass} defaultValue="" {...register('treatment.outcome')}>
                    <option value="" disabled>{tc('select')}</option>
                    {TREATMENT_OUTCOMES.map((x) => (
                      <option key={x} value={x}>{tc(`outcomes.${x}`)}</option>
                    ))}
                  </select>
                </FormField>
                <FormField id="v-drug" label={t('drug')} optionalLabel={tc('optional')}>
                  <input id="v-drug" className={fieldClass} {...register('treatment.drug')} />
                </FormField>
                <FormField id="v-dose" label={t('dose')} optionalLabel={tc('optional')}>
                  <input id="v-dose" className={fieldClass} {...register('treatment.dose')} />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField id="v-compl" label={t('complications')} optionalLabel={tc('optional')}>
                    <textarea id="v-compl" rows={2} className={fieldClass} {...register('treatment.complications')} />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <FormField id="v-next" label={t('nextReview')} hint={t('nextReviewHint')} optionalLabel={tc('optional')} error={err(errors.nextReviewDate)}>
        <input id="v-next" type="date" className={fieldClass} aria-invalid={!!errors.nextReviewDate} aria-describedby="v-next-error" {...register('nextReviewDate', { setValueAs: str })} />
      </FormField>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === 'sending'} className={brandButtonClass}>
          {status === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t('save')}
        </button>
        {status === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}
