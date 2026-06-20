'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow, GradientText } from '@/components/ui/GradientText';
import { Button } from '@/components/ui/Button';

export function Mission() {
  const t = useTranslations('Home');

  return (
    <Section id="mission">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>{t('missionEyebrow')}</Eyebrow>
          <h2 className="mt-6 text-balance text-4xl font-bold md:text-5xl">
            {t('missionTitle')}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">
            {t('missionBody')}
          </p>
          <div className="mt-8">
            <Button href="/about" variant="glass">
              {t('ctaSecondary')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03]">
            {/* Decorative animated vascular pulse */}
            <div className="absolute inset-0 animate-gradient bg-[radial-gradient(circle_at_30%_30%,rgba(139,61,255,0.35),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,45,155,0.3),transparent_55%)]" />
            <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" fill="none">
              <defs>
                <linearGradient id="pulseGrad" x1="0" y1="0" x2="400" y2="400">
                  <stop stopColor="#ff2d9b" />
                  <stop offset="0.5" stopColor="#8b3dff" />
                  <stop offset="1" stopColor="#1fe0d4" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((i) => (
                <circle
                  key={i}
                  cx="200"
                  cy="200"
                  r={60 + i * 55}
                  stroke="url(#pulseGrad)"
                  strokeWidth="1.5"
                  opacity={0.5 - i * 0.12}
                  className="origin-center animate-spin-slow"
                  style={{ animationDuration: `${24 + i * 10}s` }}
                />
              ))}
              <path
                d="M40 210 H120 L150 150 L200 270 L235 200 H360"
                stroke="url(#pulseGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="text-2xl font-semibold leading-tight">
                <GradientText>{t('ctaTitle')}</GradientText>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
