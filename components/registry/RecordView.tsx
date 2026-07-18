'use client';

import type { ReactNode } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Lock, Stethoscope, ClipboardList, FileCheck2, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { RegistryBadge } from './RegistryBadge';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import type { DecryptedRecord } from '@/lib/registry/patients';

type Row = { label: string; value: ReactNode };

function DefinitionList({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col">
          <dt className="text-xs text-[var(--color-faint)]">{r.label}</dt>
          <dd className="break-words text-sm text-[var(--color-fg)]">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Read-only display of a decrypted record (UI-SPEC 3.7). Used by clinician + admin. */
export function RecordView({
  record,
  actions,
  banner,
}: {
  record: DecryptedRecord;
  actions?: ReactNode;
  banner?: ReactNode;
}) {
  const t = useTranslations('RegistryRecord');
  const tc = useTranslations('RegistryCommon');
  const te = useTranslations('RegistryEnroll');
  const locale = useLocale();
  const format = useFormatter();

  const dash = t('none');
  const conditionName = (slug: string, other: string | null) => {
    if (slug === 'other') return other || te('conditionOptions.other');
    if (slug === 'not-sure') return te('conditionOptions.notSure');
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug;
  };
  const fmtDate = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { dateStyle: 'medium' }) : dash;
  const yn = (b: boolean) => (b ? t('given') : t('notGiven'));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* LEFT: protected PII */}
      <div className="flex flex-col gap-6">
        {banner}
        <GlassCard interactive={false} className="border-[var(--color-rose)]/25">
          <div className="mb-4 flex items-center gap-2 text-[var(--color-rose)]">
            <Lock className="size-5" />
            <h2 className="text-lg font-bold">{t('protectedData')}</h2>
          </div>
          <p className="mb-5 flex items-start gap-2 text-xs text-[var(--color-faint)]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t('protectedNote')}
          </p>
          <DefinitionList
            rows={[
              { label: t('fields.fullName'), value: record.fullName },
              { label: t('fields.guardianName'), value: record.guardianName || dash },
              { label: t('fields.cnic'), value: <span dir="ltr">{record.cnic}</span> },
              { label: t('fields.phone'), value: <span dir="ltr">{record.phone}</span> },
              { label: t('fields.altPhone'), value: record.altPhone ? <span dir="ltr">{record.altPhone}</span> : dash },
              { label: t('fields.email'), value: record.email || dash },
              { label: t('fields.dob'), value: <span dir="ltr">{record.dob}</span> },
              { label: t('fields.address'), value: record.address || dash },
            ]}
          />
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-bold">{t('demographics')}</h2>
          <DefinitionList
            rows={[
              { label: t('fields.gender'), value: tc(`genders.${record.gender}`) },
              { label: t('fields.province'), value: tc(`provinces.${record.province}`) },
              { label: t('fields.district'), value: record.district },
              { label: t('fields.birthYear'), value: record.birthYear },
              { label: t('fields.isMinor'), value: record.isMinor ? tc('yes') : tc('no') },
            ]}
          />
        </GlassCard>
      </div>

      {/* RIGHT: clinical + consent + meta */}
      <div className="flex flex-col gap-6">
        {actions}

        <GlassCard interactive={false}>
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="size-5 text-[var(--color-cyan)]" />
            <h2 className="text-lg font-bold">{t('diagnosis')}</h2>
          </div>
          {record.diagnoses.map((d) => (
            <div key={d.id} className="mb-6 last:mb-0">
              <DefinitionList
                rows={[
                  { label: t('fields.condition'), value: conditionName(d.conditionSlug, d.conditionOther) },
                  { label: t('fields.issva'), value: tc(`issva.${d.issvaCategory}`) },
                  { label: t('fields.bodySite'), value: tc(`bodySites.${d.bodySite}`) },
                  { label: t('fields.onset'), value: tc(`onsets.${d.onset}`) },
                  { label: t('fields.doctorDiagnosed'), value: tc(`doctorDiagnosed.${d.doctorDiagnosed}`) },
                  { label: t('fields.severity'), value: tc(`severity.${d.severity}`) },
                  { label: t('fields.basis'), value: tc(`basis.${d.basis}`) },
                  { label: t('fields.facility'), value: d.facility || dash },
                ]}
              />
              {d.notes && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1 text-xs text-[var(--color-faint)]">{t('fields.notes')}</p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--color-fg)]">{d.notes}</p>
                </div>
              )}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
                  <ClipboardList className="size-4" />
                  {t('treatments')}
                </div>
                {d.treatments.length === 0 ? (
                  <p className="text-sm text-[var(--color-faint)]">{t('noTreatments')}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {d.treatments.map((tr) => (
                      <li key={tr.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="font-medium">{tc(`treatmentTypes.${tr.type}`)}</span>
                        <span className="text-[var(--color-faint)]">
                          {' · '}
                          {tc(`outcomes.${tr.outcome}`)}
                          {tr.year ? ` · ${tr.year}` : ''}
                          {tr.facility ? ` · ${tr.facility}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </GlassCard>

        <GlassCard interactive={false}>
          <div className="mb-4 flex items-center gap-2">
            <FileCheck2 className="size-5 text-[var(--color-cyan)]" />
            <h2 className="text-lg font-bold">{t('consent')}</h2>
          </div>
          <DefinitionList
            rows={[
              { label: t('fields.consentRegistry'), value: yn(record.consent.registry) },
              { label: t('fields.consentContact'), value: yn(record.consent.contact) },
              { label: t('fields.consentResearch'), value: yn(record.consent.research) },
              { label: t('fields.consentGuardian'), value: yn(record.consent.guardian) },
              { label: t('fields.consentVersion'), value: record.consent.version },
              { label: t('fields.consentAt'), value: fmtDate(record.consent.at) },
            ]}
          />
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-bold">{t('meta')}</h2>
          <DefinitionList
            rows={[
              { label: t('fields.trackingCode'), value: <span dir="ltr" className="font-mono">{record.trackingCode}</span> },
              { label: t('fields.status'), value: <RegistryBadge status={record.status as 'PENDING'} /> },
              { label: t('fields.source'), value: tc(`sources.${record.source}`) },
              { label: t('fields.submittedAt'), value: fmtDate(record.createdAt) },
              { label: t('fields.verifiedAt'), value: fmtDate(record.verifiedAt) },
              { label: t('fields.clinician'), value: record.clinician ? `${record.clinician.name} · ${record.clinician.facility}` : dash },
              { label: t('fields.updatedAt'), value: fmtDate(record.updatedAt) },
            ]}
          />
        </GlassCard>
      </div>
    </div>
  );
}
