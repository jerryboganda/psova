import { headers } from 'next/headers';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { BadgeCheck, Eye, FileBadge, Plus } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { requireCenterMember } from '@/lib/registry/guards';
import { PaymentHistory } from '@/components/centres/PaymentHistory';
import { Link } from '@/i18n/navigation';
import { isPubliclyListed, membershipAllowsWrites } from '@/lib/registry/membership';
import { prisma } from '@/lib/registry/db';
import { appointmentCounts } from '@/lib/registry/centre-journey';

export const dynamic = 'force-dynamic';

export default async function CentreHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres');
  const tm = await getTranslations('RegistryAdmin.centres');
  const format = await getFormatter();

  const { user, center, state } = await requireCenterMember(await headers());
  const date = (d: Date) => format.dateTime(d, { dateStyle: 'medium' });
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [appts, patients, recent] = await Promise.all([
    appointmentCounts(center),
    prisma.registryPatient.count({ where: { centerId: center.id } }),
    prisma.registryPatient.count({ where: { centerId: center.id, createdAt: { gte: weekAgo } } }),
  ]);

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('dash.welcome', { name: user.name })}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{center.nameEn}</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/centre/patients" className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25">
          <p className="text-3xl font-bold">{patients}</p>
          <p className="text-sm text-[var(--color-muted)]">{t('dash.stats.patients')}</p>
        </Link>
        <Link href="/centre/patients" className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25">
          <p className="text-3xl font-bold">{recent}</p>
          <p className="text-sm text-[var(--color-muted)]">{t('dash.stats.recent')}</p>
        </Link>
        <Link href="/centre/appointments?scope=today" className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25">
          <p className="text-3xl font-bold">{appts.today}</p>
          <p className="text-sm text-[var(--color-muted)]">{t('dash.stats.today')}</p>
        </Link>
        <Link href="/centre/appointments?scope=overdue" className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25">
          <p className={`text-3xl font-bold ${appts.overdue > 0 ? 'text-amber-300' : ''}`}>{appts.overdue}</p>
          <p className="text-sm text-[var(--color-muted)]">{t('dash.stats.overdue')}</p>
        </Link>
        {membershipAllowsWrites(state) && (
          <Link href="/centre/patients/new" className="flex items-center gap-3 rounded-[var(--radius-2xl)] bg-brand p-5 font-semibold text-white">
            <Plus className="size-5" />
            {t('dash.stats.add')}
          </Link>
        )}
      </div>

      {isPubliclyListed(center.status, state) && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/centre/certificate" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10">
            <FileBadge className="size-4" />
            {t('dash.certificate')}
          </Link>
          <Link href={`/centres/${center.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10">
            <Eye className="size-4" />
            {t('dash.publicProfile')}
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard interactive={false}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BadgeCheck className="size-5 text-[var(--color-cyan)]" />
            {t('dash.membership.title')}
          </h2>
          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <dt className="text-[var(--color-muted)]">{t('dash.membership.tier')}</dt>
            <dd className="font-medium">{t(`tiers.${center.tier}`)}</dd>
            <dt className="text-[var(--color-muted)]">{t('dash.membership.expires')}</dt>
            <dd className="font-medium">
              {center.membershipExpiresAt ? date(center.membershipExpiresAt) : tm('noMembership')}
            </dd>
          </dl>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">
            {t(`dash.membership.state.${state}`)}
          </p>
        </GlassCard>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{t('dash.payments.title')}</h2>
          <PaymentHistory centerId={center.id} />
        </GlassCard>
      </div>
    </Section>
  );
}
