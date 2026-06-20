'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { NewsCard } from '@/components/news/NewsCard';
import { NEWS } from '@/data/news';

export function NewsPreview() {
  const t = useTranslations('Home');
  const latest = NEWS.slice(0, 3);

  return (
    <Section id="news">
      <SectionHeading eyebrow={t('newsEyebrow')} title={t('newsTitle')} />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {latest.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.1} className="h-full">
            <NewsCard item={item} />
          </Reveal>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <Button href="/news" variant="glass" size="lg">
          {t('newsCta')}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </Section>
  );
}
