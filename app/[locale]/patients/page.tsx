import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Stethoscope, Users, ArrowRight, HandHeart, GraduationCap, Heart } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { AskExpertForm } from '@/components/forms/AskExpertForm';
import { GLOSSARY } from '@/data/glossary';
import { localized } from '@/lib/utils';

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Patients');

  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ];

  const practical = [
    { Icon: HandHeart, title: t('costTitle'), body: t('costBody'), accent: '#ff2d9b' },
    { Icon: GraduationCap, title: t('schoolTitle'), body: t('schoolBody'), accent: '#3d6cff' },
    { Icon: Heart, title: t('stigmaTitle'), body: t('stigmaBody'), accent: '#1fe0d4' },
  ];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <SectionHeading title={t('newDxTitle')} />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="h-full rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={t('treatmentTitle')} />
          <Reveal delay={0.1} className="mt-8">
            <GlassCard accent="#8b3dff" className="group">
              <Stethoscope className="size-9 text-[var(--color-cyan)]" />
              <p className="mt-5 text-lg leading-relaxed text-[var(--color-muted)]">
                {t('treatmentBody')}
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <SectionHeading title={t('askTitle')} lead={t('askLead')} />
          <Reveal delay={0.1} className="mt-10">
            <GlassCard interactive={false}>
              <AskExpertForm />
            </GlassCard>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#1fe0d4" className="group flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Users className="size-9 text-[var(--color-cyan)]" />
              <h3 className="mt-5 text-2xl font-semibold">{t('supportTitle')}</h3>
              <p className="mt-3 text-[var(--color-muted)]">{t('supportBody')}</p>
            </div>
            <Button href="/find-a-specialist" variant="glass" size="md" className="shrink-0">
              {t('supportTitle')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </GlassCard>
        </Reveal>
      </Section>

      <Section>
        <SectionHeading title={t('practicalTitle')} />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {practical.map((c) => (
            <StaggerItem key={c.title}>
              <GlassCard accent={c.accent} className="group h-full">
                <c.Icon className="size-9" style={{ color: c.accent }} />
                <h3 className="mt-5 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{c.body}</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={t('glossaryTitle')} />
          <Reveal delay={0.1} className="mt-10">
            <Accordion
              items={GLOSSARY.map((g) => ({
                q: localized(g.term, locale),
                a: localized(g.def, locale),
              }))}
            />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
