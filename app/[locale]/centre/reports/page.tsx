import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Download } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { centrePageContext } from '@/lib/registry/centre-page';
import { getCentreReport } from '@/lib/registry/centre-reports';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** A label, a proportional bar and a count. */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate sm:w-56">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-brand" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </div>
      <span dir="ltr" className="w-10 text-end font-semibold">{value}</span>
    </div>
  );
}

export default async function CentreReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center, member } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const t = await getTranslations('Centres.reports');
  const tc = await getTranslations('RegistryCommon');
  const tv = await getTranslations('Centres.visit');
  const ta = await getTranslations('Centres.appointments');
  const r = await getCentreReport(center);

  const conditionName = (slug: string) => {
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug === 'other' ? t('conditionOther') : t('conditionUnknown');
  };
  const maxCondition = Math.max(0, ...r.byCondition.map((c) => c.count));
  const maxMonth = Math.max(0, ...r.visits.byMonth.map((m) => m.count));
  const maxResponse = Math.max(0, ...r.visits.byResponse.map((x) => x.count));
  const attended = r.appointments.find((a) => a.status === 'DONE')?.count ?? 0;
  const missed = r.appointments.find((a) => a.status === 'MISSED')?.count ?? 0;
  const attendance = attended + missed > 0 ? Math.round((attended / (attended + missed)) * 100) : null;

  const stat = (n: number | string, label: string) => (
    <div className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-3xl font-bold">{n}</p>
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
    </div>
  );

  return (
    <Section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-[var(--color-muted)]">{t('lede')}</p>
        </div>
        {member.role === 'OWNER' && (
          <div className="flex flex-wrap gap-2">
            {(['patients', 'visits'] as const).map((k) => (
              <a
                key={k}
                href={`/api/centre/reports/export?kind=${k}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                <Download className="size-4" />
                {t(`export.${k}`)}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat(r.patients.total, t('stats.patients'))}
        {stat(r.visits.total, t('stats.visits'))}
        {stat(r.patients.sharedWithNvar, t('stats.nvar'))}
        {stat(attendance === null ? '—' : `${attendance}%`, t('stats.attendance'))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{t('byCondition')}</h2>
          {r.byCondition.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t('none')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {r.byCondition.map((c) => <Bar key={c.slug} label={conditionName(c.slug)} value={c.count} max={maxCondition} />)}
            </div>
          )}
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{t('visitsByMonth')}</h2>
          <div className="flex flex-col gap-2">
            {r.visits.byMonth.map((m) => <Bar key={m.month} label={m.month} value={m.count} max={maxMonth} />)}
          </div>
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{t('byResponse')}</h2>
          {r.visits.byResponse.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t('none')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {r.visits.byResponse.map((x) => <Bar key={x.score} label={tv(`responses.${x.score}`)} value={x.count} max={maxResponse} />)}
            </div>
          )}
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{t('appointments')}</h2>
          {r.appointments.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t('none')}</p>
          ) : (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {r.appointments.map((a) => (
                <div key={a.status} className="contents">
                  <dt className="text-[var(--color-muted)]">{ta(`statuses.${a.status}`)}</dt>
                  <dd dir="ltr" className="text-end font-semibold">{a.count}</dd>
                </div>
              ))}
            </dl>
          )}
        </GlassCard>

        <GlassCard interactive={false} className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t('treatments')}</h2>
          {r.treatments.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t('none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-start text-xs text-[var(--color-faint)]">
                    <th className="py-2 text-start font-medium">{t('treatment')}</th>
                    <th className="py-2 text-end font-medium">{t('total')}</th>
                    <th className="py-2 ps-6 text-start font-medium">{t('outcomes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.treatments.map((row) => (
                    <tr key={row.type} className="border-b border-white/5">
                      <td className="py-2">{tc(`treatmentTypes.${row.type}`)}</td>
                      <td dir="ltr" className="py-2 text-end font-semibold">{row.total}</td>
                      <td className="py-2 ps-6 text-[var(--color-muted)]">
                        {row.outcomes.map((o) => `${tc(`outcomes.${o.outcome}`)}: ${o.count}`).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </Section>
  );
}
