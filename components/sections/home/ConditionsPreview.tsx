'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { ConditionCard } from '@/components/conditions/ConditionCard';
import { CONDITIONS } from '@/data/conditions';

export function ConditionsPreview() {
  const t = useTranslations('Home');
  const tc = useTranslations('Conditions');
  const locale = useLocale();
  const featured = CONDITIONS.slice(0, 6);

  return (
    <Section id="conditions">
      <SectionHeading
        eyebrow={t('conditionsEyebrow')}
        title={t('conditionsTitle')}
        lead={t('conditionsLead')}
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.08} className="h-full">
            <ConditionCard
              condition={c}
              locale={locale}
              categoryLabel={c.category === 'tumor' ? tc('categoryTumor') : tc('categoryMalformation')}
            />
          </Reveal>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <Button href="/conditions" variant="glass" size="lg">
          {t('conditionsCta')}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </Section>
  );
}
