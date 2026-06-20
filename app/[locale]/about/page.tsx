import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Target, Eye } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { VALUES, PARTNERS } from '@/data/site';
import { localized } from '@/lib/utils';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('About');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { Icon: Target, title: t('missionTitle'), body: t('missionBody'), accent: '#ff2d9b' },
            { Icon: Eye, title: t('visionTitle'), body: t('visionBody'), accent: '#1fe0d4' },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <GlassCard accent={c.accent} className="group h-full">
                <c.Icon className="size-9" style={{ color: c.accent }} />
                <h2 className="mt-5 text-2xl font-semibold">{c.title}</h2>
                <p className="mt-3 text-[var(--color-muted)]">{c.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading title={t('storyTitle')} />
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">{t('storyBody')}</p>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading title={t('valuesTitle')} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.icon} delay={(i % 4) * 0.08}>
              <div className="h-full rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold">{localized(v.title, locale)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {localized(v.body, locale)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow={t('teamTitle')} title={t('teamTitle')} lead={t('teamLead')} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Reveal key={i} delay={(i % 4) * 0.08}>
              <div className="flex flex-col items-center rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 text-center">
                <div className="size-20 rounded-full bg-[var(--gradient-brand)] opacity-80" />
                <p className="mt-4 font-semibold">{t('teamPlaceholder')}</p>
                <p className="text-sm text-[var(--color-faint)]">— —</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title={t('partnersTitle')} lead={t('partnersLead')} />
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={(i % 5) * 0.06}>
              <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center">
                <span className="text-xl font-bold tracking-tight">{p.name}</span>
                <span className="text-xs text-[var(--color-faint)]">{localized(p.note, locale)}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
