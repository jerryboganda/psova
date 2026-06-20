import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Users,
  ArrowRight,
  Network,
  ClipboardList,
  Microscope,
  Megaphone,
  Stethoscope,
} from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default async function ProfessionalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Professionals');

  const features = [
    { Icon: Network, title: t('referralTitle'), body: t('referralBody'), accent: '#ff2d9b' },
    {
      Icon: ClipboardList,
      title: t('classificationTitle'),
      body: t('classificationBody'),
      accent: '#3d6cff',
    },
    { Icon: Microscope, title: t('researchTitle'), body: t('researchBody'), accent: '#8b3dff' },
    { Icon: Megaphone, title: t('eventsTitle'), body: t('eventsBody'), accent: '#1fe0d4' },
    { Icon: Stethoscope, title: t('directoryTitle'), body: t('directoryBody'), accent: '#ff4d6d' },
  ];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#3d6cff" className="group flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Users className="size-9 text-[var(--color-cyan)]" />
              <h2 className="mt-5 text-2xl font-semibold">{t('membershipTitle')}</h2>
              <p className="mt-3 text-[var(--color-muted)]">{t('membershipBody')}</p>
            </div>
            <Button href="/contact" variant="primary" size="md" className="shrink-0">
              {t('joinCta')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </GlassCard>
        </Reveal>
      </Section>

      <Section>
        <Stagger className="grid gap-5 md:grid-cols-2">
          {features.map((c) => (
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
