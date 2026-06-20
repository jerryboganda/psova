'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Heart } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { GradientText } from '@/components/ui/GradientText';

export function FinalCTA() {
  const t = useTranslations('Home');

  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 p-10 text-center md:p-20">
          <div className="absolute inset-0 -z-10 animate-gradient bg-[radial-gradient(circle_at_25%_25%,rgba(255,45,155,0.28),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(31,224,212,0.24),transparent_55%),linear-gradient(120deg,rgba(139,61,255,0.18),transparent)]" />
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-bold md:text-6xl">
            <GradientText>{t('ctaTitle')}</GradientText>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted)] md:text-xl">
            {t('ctaBody')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/donate" size="lg">
              <Heart className="size-4" />
              {t('ctaButton')}
            </Button>
            <Button href="/contact" variant="glass" size="lg">
              {t('ctaSecondary')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
