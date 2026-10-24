import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Activity, Users, ShieldCheck, Lock, ClipboardList, Search, BarChart3, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Registry' });
  return { title: t('title'), description: t('lede') };
}

export default async function RegistryLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Registry');

  const cards = [
    { icon: Activity, title: t('whyTitle'), body: t('whyBody'), accent: 'var(--color-magenta)' },
    { icon: Users, title: t('whoTitle'), body: t('whoBody'), accent: 'var(--color-blue)' },
    { icon: ShieldCheck, title: t('privacyTitle'), body: t('privacyBody'), accent: 'var(--color-cyan)', badge: t('privacyBadge') },
  ];

  const consentItems = [
    { q: t('consent1Q'), a: t('consent1A') },
    { q: t('consent2Q'), a: t('consent2A') },
    { q: t('consent3Q'), a: t('consent3A') },
    { q: t('consent4Q'), a: t('consent4A') },
  ];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lede')} />

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <GlassCard key={c.title} accent={c.accent} interactive={false}>
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/5" style={{ color: c.accent }}>
                <c.icon className="size-6" />
              </div>
              <h2 className="mb-2 text-xl font-bold">{c.title}</h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">{c.body}</p>
              {c.badge && (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-cyan)]">
                  <Lock className="size-3.5" />
                  {c.badge}
                </span>
              )}
            </GlassCard>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/registry/enroll" size="lg">
            <ClipboardList className="size-5" />
            {t('ctaEnroll')}
          </Button>
          <Button href="/registry/status" variant="glass" size="lg">
            <Search className="size-5" />
            {t('ctaStatus')}
          </Button>
          <Button href="/registry/statistics" variant="glass" size="lg">
            <BarChart3 className="size-5" />
            {t('ctaStats')}
          </Button>
        </div>
      </Section>

      <Section className="pt-0">
        <GlassCard interactive={false} className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-[var(--color-purple)]">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <h2 className="mb-1 text-lg font-bold">{t('clinicianTitle')}</h2>
              <p className="text-sm text-[var(--color-muted)]">{t('clinicianStrip')}</p>
            </div>
          </div>
          <Button href="/registry/login" variant="glass" className="shrink-0">
            {t('clinicianCta')}
          </Button>
        </GlassCard>
      </Section>

      <Section className="pt-0">
        <h2 className="mb-6 text-2xl font-bold">{t('consentHeading')}</h2>
        <Accordion items={consentItems} />

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-1 text-sm font-semibold text-[var(--color-fg)]">{t('disclaimerTitle')}</h3>
          <p className="text-sm text-[var(--color-muted)]">{t('disclaimer')}</p>
        </div>
      </Section>
    </>
  );
}
