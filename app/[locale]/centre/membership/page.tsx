import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { PaymentHistory } from '@/components/centres/PaymentHistory';
import { PaymentProofForm } from '@/components/centres/PaymentProofForm';
import { centrePageContext } from '@/lib/registry/centre-page';
import { MEMBERSHIP_FEE_PKR } from '@/lib/registry/constants';

export const dynamic = 'force-dynamic';

export default async function CentreMembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center, state } = await centrePageContext(locale, ['OWNER']);
  const t = await getTranslations('Centres.membership');
  const td = await getTranslations('Centres.dash');
  const tm = await getTranslations('RegistryAdmin.centres');
  const format = await getFormatter();

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('lede', { fee: MEMBERSHIP_FEE_PKR.toLocaleString('en-US') })}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <GlassCard interactive={false}>
            <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <dt className="text-[var(--color-muted)]">{td('membership.expires')}</dt>
              <dd className="font-medium">
                {center.membershipExpiresAt
                  ? format.dateTime(center.membershipExpiresAt, { dateStyle: 'medium' })
                  : tm('noMembership')}
              </dd>
            </dl>
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">
              {td(`membership.state.${state}`)}
            </p>
          </GlassCard>

          <GlassCard interactive={false}>
            <h2 className="mb-2 text-lg font-semibold">{t('submitTitle')}</h2>
            <p className="mb-4 text-sm text-[var(--color-muted)]">{t('howTo')}</p>
            <Link href="/donate" className="mb-5 inline-block text-sm text-[var(--color-cyan)] hover:underline">
              {t('accounts')}
            </Link>
            <PaymentProofForm />
          </GlassCard>
        </div>

        <GlassCard interactive={false}>
          <h2 className="mb-4 text-lg font-semibold">{td('payments.title')}</h2>
          <PaymentHistory centerId={center.id} />
        </GlassCard>
      </div>
    </Section>
  );
}
