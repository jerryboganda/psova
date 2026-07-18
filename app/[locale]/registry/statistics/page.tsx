import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Users, MapPin, Stethoscope, Activity, Hourglass, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/registry/StatCard';
import { BarList } from '@/components/registry/BarList';
import { TrendLine } from '@/components/registry/TrendLine';
import { getPublicStats, type PublicStats } from '@/lib/registry/stats';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

export const revalidate = 3600;

// Empty, unpublished stats used when the DB is unreachable (e.g. at build time
// before the database is provisioned). ISR revalidates to real data later.
const EMPTY_STATS: PublicStats = {
  published: false,
  totals: { verified: 0, provinces: 0, clinicians: 0, conditions: 0 },
  byProvince: [],
  byCondition: [],
  byGender: [],
  byAgeBand: [],
  byYear: [],
  updatedAt: new Date(0).toISOString(),
};

async function safeStats(): Promise<PublicStats> {
  try {
    return await getPublicStats();
  } catch {
    return EMPTY_STATS;
  }
}

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryStats');
  const tc = await getTranslations('RegistryCommon');
  const te = await getTranslations('RegistryEnroll');

  const stats = await safeStats();
  const suppressed = t('suppressed');
  const suppressedSr = t('suppressedSr');

  const conditionName = (slug: string) => {
    if (slug === 'other') return te('conditionOptions.other');
    if (slug === 'not-sure') return te('conditionOptions.notSure');
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug;
  };

  const provinceItems = stats.byProvince.map((x) => ({ label: tc(`provinces.${x.province}`), count: x.count }));
  const conditionItems = stats.byCondition.map((x) => ({ label: conditionName(x.slug), count: x.count }));
  const genderItems = stats.byGender.map((x) => ({ label: tc(`genders.${x.gender}`), count: x.count }));
  const ageItems = stats.byAgeBand.map((x) => ({ label: tc(`ageBands.${x.band}`), count: x.count }));

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lede')} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('cards.total')} value={stats.totals.verified} Icon={Activity} accent="var(--color-cyan)" />
          <StatCard label={t('cards.provinces')} value={stats.totals.provinces} Icon={MapPin} accent="var(--color-blue)" />
          <StatCard label={t('cards.clinicians')} value={stats.totals.clinicians} Icon={Stethoscope} accent="var(--color-purple)" />
          <StatCard label={t('cards.conditions')} value={stats.totals.conditions} Icon={Users} accent="var(--color-magenta)" />
        </div>

        {!stats.published ? (
          <GlassCard interactive={false} className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-white/5 text-[var(--color-cyan)]">
              <Hourglass className="size-7" />
            </div>
            <h2 className="text-xl font-bold">{t('inProgress')}</h2>
            <p className="max-w-md text-sm text-[var(--color-muted)]">{t('inProgressBody')}</p>
          </GlassCard>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            <GlassCard interactive={false}>
              <BarList title={t('charts.province')} items={provinceItems} suppressedLabel={suppressed} suppressedSr={suppressedSr} />
            </GlassCard>
            <GlassCard interactive={false}>
              <BarList title={t('charts.condition')} items={conditionItems} suppressedLabel={suppressed} suppressedSr={suppressedSr} />
            </GlassCard>
            <div className="grid gap-8 lg:grid-cols-2">
              <GlassCard interactive={false}>
                <BarList title={t('charts.gender')} items={genderItems} suppressedLabel={suppressed} suppressedSr={suppressedSr} />
              </GlassCard>
              <GlassCard interactive={false}>
                <BarList title={t('charts.age')} items={ageItems} suppressedLabel={suppressed} suppressedSr={suppressedSr} />
              </GlassCard>
            </div>
            <GlassCard interactive={false}>
              <TrendLine title={t('charts.trend')} points={stats.byYear} suppressedSr={suppressedSr} />
            </GlassCard>
          </div>
        )}

        <p className="mt-8 flex items-start gap-2 text-sm text-[var(--color-faint)]">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t('notes')}
        </p>
      </Section>
    </>
  );
}
