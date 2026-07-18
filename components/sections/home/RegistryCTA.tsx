'use client';

import { useTranslations } from 'next-intl';
import { ClipboardList, BarChart3, ShieldCheck } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Eyebrow, GradientText } from '@/components/ui/GradientText';

export function RegistryCTA() {
  const t = useTranslations('Home');

  return (
    <Section>
      <Reveal>
        <div className="glass relative overflow-hidden rounded-[var(--radius-2xl)] p-8 md:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-24 -top-24 size-64 rounded-full bg-[var(--color-cyan)]/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>{t('registryEyebrow')}</Eyebrow>
              <h2 className="mt-4 text-balance text-3xl font-bold md:text-4xl">
                <GradientText>{t('registryTitle')}</GradientText>
              </h2>
              <p className="mt-4 text-[var(--color-muted)]">{t('registryBody')}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-cyan)]">
                <ShieldCheck className="size-4" />
                AES-256
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              <Button href="/registry" size="lg">
                <ClipboardList className="size-5" />
                {t('registryCta')}
              </Button>
              <Button href="/registry/statistics" variant="glass">
                <BarChart3 className="size-5" />
                {t('registryStats')}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
