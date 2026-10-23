import { getLocale, getTranslations } from 'next-intl/server';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

type Attrs = {
  gender?: string | null;
  ageBand?: string | null;
  province?: string | null;
  conditionSlug?: string | null;
  bodySite?: string | null;
  severity?: string | null;
  basis?: string | null;
  treatments?: { type: string; year: number | null; outcome: string }[];
};

/** The de-identified facts of a case, as shown to another centre. Never any name, contact or date of birth. */
export async function CaseAttributes(a: Attrs) {
  const tc = await getTranslations('RegistryCommon');
  const t = await getTranslations('Centres.sharing');
  const locale = await getLocale();
  const condition = a.conditionSlug ? CONDITIONS.find((c) => c.slug === a.conditionSlug) : null;

  const rows: [string, string][] = [];
  if (condition) rows.push([t('attrCondition'), localized(condition.name, locale)]);
  if (a.gender) rows.push([t('attrGender'), tc(`genders.${a.gender}`)]);
  if (a.ageBand) rows.push([t('attrAge'), tc(`ageBands.${a.ageBand}`)]);
  if (a.province) rows.push([t('attrProvince'), tc(`provinces.${a.province}`)]);
  if (a.bodySite) rows.push([t('attrSite'), tc(`bodySites.${a.bodySite}`)]);
  if (a.severity && a.severity !== 'UNKNOWN') rows.push([t('attrSeverity'), tc(`severity.${a.severity}`)]);
  if (a.basis && a.basis !== 'UNKNOWN') rows.push([t('attrBasis'), tc(`basis.${a.basis}`)]);

  return (
    <div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="text-[var(--color-faint)]">{k}:</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {a.treatments && a.treatments.length > 0 && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          <span className="text-[var(--color-faint)]">{t('attrTreatments')}: </span>
          {a.treatments
            .map((x) => `${tc(`treatmentTypes.${x.type}`)}${x.year ? ` (${x.year})` : ''} → ${tc(`outcomes.${x.outcome}`)}`)
            .join('; ')}
        </p>
      )}
    </div>
  );
}
