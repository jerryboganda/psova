import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, CheckCircle2, XCircle, UserCog, Building2, CreditCard, HandHeart, MailWarning } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/registry/StatCard';
import { RegistryBadge } from '@/components/registry/RegistryBadge';
import { Link } from '@/i18n/navigation';
import { getAdminOverview, listRecords } from '@/lib/registry/patients';
import { adminQueueCounts } from '@/lib/registry/centers';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryAdmin');
  const tc = await getTranslations('RegistryCommon');

  const [overview, recent, queues] = await Promise.all([getAdminOverview(), listRecords({ page: 1 }), adminQueueCounts()]);
  const rows = recent.items.slice(0, 10);

  const conditionName = (slug: string) => {
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug;
  };
  const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  return (
    <Section>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('overview.title')}</h1>

      {!emailConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <MailWarning className="mt-0.5 size-4 shrink-0" />
          <p>{t('overview.emailOff')}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('overview.pending')} value={overview.pending} Icon={Clock} accent="var(--color-magenta)" />
        <StatCard label={t('overview.verified')} value={overview.verified} Icon={CheckCircle2} accent="var(--color-cyan)" />
        <StatCard label={t('overview.rejected')} value={overview.rejected} Icon={XCircle} accent="var(--color-rose)" />
        <StatCard label={t('overview.cliniciansPending')} value={overview.cliniciansPending} Icon={UserCog} accent="var(--color-blue)" />
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold">{t('overview.networkTitle')}</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        <Link href="/registry/admin/centres?tab=centres" className="block">
          <StatCard label={t('overview.centresToReview')} value={queues.centres} Icon={Building2} accent="var(--color-cyan)" />
        </Link>
        <Link href="/registry/admin/centres?tab=payments" className="block">
          <StatCard label={t('overview.paymentsToVerify')} value={queues.payments} Icon={CreditCard} accent="var(--color-magenta)" />
        </Link>
        <Link href="/registry/admin/support" className="block">
          <StatCard label={t('overview.supportToReview')} value={queues.support} Icon={HandHeart} accent="var(--color-rose)" />
        </Link>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('overview.recent')}</h2>
          <Link href="/registry/admin/records" className="text-sm font-semibold text-[var(--color-cyan)] hover:underline">
            {t('overview.viewAll')}
          </Link>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-start text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                  <th className="px-4 py-3 text-start">{t('table.code')}</th>
                  <th className="px-4 py-3 text-start">{t('table.status')}</th>
                  <th className="px-4 py-3 text-start">{t('table.province')}</th>
                  <th className="px-4 py-3 text-start">{t('table.condition')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/registry/admin/records/${r.id}`} className="font-mono text-xs text-[var(--color-cyan)] hover:underline" dir="ltr">
                        {r.trackingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><RegistryBadge status={r.status as 'PENDING'} /></td>
                    <td className="px-4 py-3">{tc(`provinces.${r.province}`)}</td>
                    <td className="px-4 py-3">{conditionName(r.conditionSlug)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-muted)]">{tc('empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  );
}
