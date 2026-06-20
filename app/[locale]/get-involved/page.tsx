import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HandHeart, Users, Megaphone, Network, ArrowRight, Heart } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default async function GetInvolvedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('GetInvolved');

  const ways = [
    { Icon: Users, title: t('volunteerTitle'), body: t('volunteerBody'), accent: '#3d6cff' },
    { Icon: Heart, title: t('fundraiseTitle'), body: t('fundraiseBody'), accent: '#1fe0d4' },
    { Icon: Network, title: t('partnerTitle'), body: t('partnerBody'), accent: '#8b3dff' },
    { Icon: Megaphone, title: t('awarenessTitle'), body: t('awarenessBody'), accent: '#ff4d6d' },
  ];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#ff2d9b" className="group flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <HandHeart className="size-9" style={{ color: '#ff2d9b' }} />
              <h2 className="mt-5 text-2xl font-semibold">{t('donateTitle')}</h2>
              <p className="mt-3 text-[var(--color-muted)]">{t('donateBody')}</p>
            </div>
            <Button href="/donate" variant="primary" size="md" className="shrink-0">
              {t('donateCta')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </GlassCard>
        </Reveal>
      </Section>

      <Section>
        <Stagger className="grid gap-5 sm:grid-cols-2">
          {ways.map((c) => (
            <StaggerItem key={c.title}>
              <GlassCard accent={c.accent} className="group h-full">
                <c.Icon className="size-9" style={{ color: c.accent }} />
                <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--color-muted)]">{c.body}</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
