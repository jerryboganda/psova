import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sparkles, GitBranch, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

export default async function WhatAreVAPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('WhatAreVA');

  const tumors = CONDITIONS.filter((c) => c.category === 'tumor');
  const malformations = CONDITIONS.filter((c) => c.category === 'malformation');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading title={t('defTitle')} />
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">{t('defBody')}</p>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading title={t('twoTypesTitle')} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              Icon: Sparkles,
              title: t('tumorsTitle'),
              body: t('tumorsBody'),
              accent: '#ff2d9b',
            },
            {
              Icon: GitBranch,
              title: t('malformationsTitle'),
              body: t('malformationsBody'),
              accent: '#3d6cff',
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <GlassCard accent={c.accent} className="group h-full">
                <c.Icon className="size-9" style={{ color: c.accent }} />
                <h3 className="mt-5 text-2xl font-semibold">{c.title}</h3>
                <p className="mt-3 text-[var(--color-muted)]">{c.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title={t('classificationTitle')} lead={t('classificationLead')} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold">{t('tumorsTitle')}</h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {tumors.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/conditions/${c.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:border-white/25 hover:text-white"
                  >
                    {localized(c.name, locale)}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold">{t('malformationsTitle')}</h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {malformations.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/conditions/${c.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:border-white/25 hover:text-white"
                  >
                    {localized(c.name, locale)}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#1fe0d4" className="group">
            <h3 className="text-2xl font-semibold">{t('keyPointTitle')}</h3>
            <p className="mt-3 text-lg leading-relaxed text-[var(--color-muted)]">
              {t('keyPointBody')}
            </p>
          </GlassCard>
        </Reveal>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading title={t('ctaTitle')} lead={t('ctaBody')} />
          <Reveal delay={0.15} className="mt-10 flex justify-center">
            <Button href="/conditions" variant="primary" size="lg">
              {t('ctaTitle')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
