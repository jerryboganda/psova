'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Section } from '@/components/ui/Section';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GradientText, Eyebrow } from '@/components/ui/GradientText';
import { STATS } from '@/data/site';
import { localized } from '@/lib/utils';

export function StatsBand() {
  const t = useTranslations('Home');
  const locale = useLocale();

  return (
    <Section>
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-[var(--gradient-soft)] p-8 md:p-14">
        <div className="absolute inset-0 -z-10 animate-gradient bg-[radial-gradient(circle_at_20%_20%,rgba(255,45,155,0.18),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(31,224,212,0.16),transparent_45%)]" />
        <Reveal className="max-w-2xl">
          <Eyebrow>{t('statsTitle')}</Eyebrow>
          <p className="mt-4 text-lg text-[var(--color-muted)] md:text-xl">{t('statsLead')}</p>
        </Reveal>
        <Stagger className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <StaggerItem key={s.value}>
              <div className="flex flex-col gap-2">
                <span dir="ltr" className="text-5xl font-extrabold tracking-tight md:text-6xl rtl:text-end">
                  <GradientText>{s.value}</GradientText>
                </span>
                <span className="text-sm leading-snug text-[var(--color-muted)]">
                  {localized(s.label, locale)}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
