import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HandHeart, ShieldCheck, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { PaymentMethods } from '@/components/donate/PaymentMethods';
import { listPublicSupport } from '@/lib/registry/support-fund';

// Funding progress changes as PSOVA records donations.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SupportFund' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function SupportFundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('SupportFund');
  const { items, fundedTotalPkr, fundedCount } = await listPublicSupport();
  const pkr = (n: number) => `PKR ${n.toLocaleString('en-US')}`;

  const steps = [
    { Icon: Stethoscope, key: 'step1' },
    { Icon: ShieldCheck, key: 'step2' },
    { Icon: HandHeart, key: 'step3' },
  ] as const;

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {steps.map(({ Icon, key }) => (
              <GlassCard key={key} interactive={false}>
                <Icon className="mb-3 size-6 text-[var(--color-cyan)]" />
                <p className="text-sm">{t(key)}</p>
              </GlassCard>
            ))}
          </div>

          {fundedTotalPkr > 0 && (
            <p className="mb-8 text-center text-sm text-[var(--color-muted)]">
              {t('raised', { amount: pkr(fundedTotalPkr), count: fundedCount })}
            </p>
          )}

          {items.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t('empty')}</p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {items.map((r) => {
                const pct = Math.min(100, Math.round((r.fundedPkr / r.estimatedCostPkr) * 100));
                const blurb = locale === 'ur' && r.blurbUr ? r.blurbUr : r.blurbEn;
                return (
                  <li key={r.publicCode}>
                    <GlassCard interactive={false} className="h-full">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold leading-snug">{r.treatment}</h2>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            r.status === 'FUNDED' ? 'bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]' : 'bg-amber-400/15 text-amber-200'
                          }`}
                        >
                          {t(`status.${r.status}`)}
                        </span>
                      </div>
                      <p className="mb-3 text-xs text-[var(--color-faint)]">
                        {t('treatedAt', { centre: r.centre.name, city: r.centre.city })}
                      </p>
                      <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--color-muted)]">{blurb}</p>

                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span dir="ltr" className="font-semibold">{pkr(r.fundedPkr)}</span>
                        <span dir="ltr" className="text-[var(--color-muted)]">{t('goal', { amount: pkr(r.estimatedCostPkr) })}</span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-faint)]">
                        <span>
                          {t('code')}: <span dir="ltr" className="font-mono font-semibold text-[var(--color-fg)]">{r.publicCode}</span>
                        </span>
                        {r.sponsor && <span>{t('fundedBy', { name: r.sponsor })}</span>}
                      </div>
                    </GlassCard>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-2xl font-bold">{t('giveTitle')}</h2>
          <p className="mb-6 max-w-2xl text-[var(--color-muted)]">{t('giveBody')}</p>
          <PaymentMethods />
        </div>
      </Section>
    </>
  );
}
