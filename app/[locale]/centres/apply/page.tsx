import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Banknote, Building2, LayoutDashboard, MessagesSquare, QrCode, Share2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { TierBadge } from '@/components/centres/TierBadge';
import { CentreApplyWizard } from '@/components/centres/CentreApplyWizard';

const BENEFITS = [
  { key: 'listing', Icon: Building2 },
  { key: 'dashboard', Icon: LayoutDashboard },
  { key: 'qr', Icon: QrCode },
  { key: 'share', Icon: Share2 },
  { key: 'mdt', Icon: MessagesSquare },
] as const;

export default async function CentreApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('apply.title')} lead={t('apply.lede')} />
      <Section>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <GlassCard interactive={false} className="order-2 lg:order-1">
            <CentreApplyWizard />
          </GlassCard>

          <aside className="order-1 flex flex-col gap-5 lg:order-2">
            <GlassCard interactive={false}>
              <div className="mb-3 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
                  <Banknote className="size-5" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--color-muted)]">{t('apply.feeTitle')}</h2>
              </div>
              <p className="text-2xl font-bold">{t('apply.feeAmount')}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{t('apply.feeNote')}</p>
            </GlassCard>

            <GlassCard interactive={false}>
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-muted)]">{t('apply.benefitsTitle')}</h2>
              <ul className="flex flex-col gap-4">
                {BENEFITS.map(({ key, Icon }) => (
                  <li key={key} className="flex gap-3 text-sm">
                    <Icon className="mt-0.5 size-5 shrink-0 text-[var(--color-cyan)]" />
                    <span>{t(`apply.benefits.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard interactive={false}>
              <h2 className="mb-1 text-sm font-semibold text-[var(--color-muted)]">{t('apply.tiersTitle')}</h2>
              <p className="mb-4 text-xs text-[var(--color-faint)]">{t('apply.tiersNote')}</p>
              <ul className="flex flex-col gap-4">
                {(['MEMBER', 'ACCREDITED', 'EXCELLENCE'] as const).map((tier) => (
                  <li key={tier} className="flex flex-col gap-1.5 text-sm">
                    <TierBadge tier={tier} />
                    <span className="text-[var(--color-muted)]">{t(`tiersInfo.${tier}`)}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <Link href="/registry/login" className="text-center text-sm text-[var(--color-cyan)] hover:underline">
              {t('apply.already')}
            </Link>
          </aside>
        </div>
      </Section>
    </>
  );
}
