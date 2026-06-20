'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, MapPin } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/GradientText';
import { Button } from '@/components/ui/Button';
import { CARE_CENTERS } from '@/data/centers';
import { localized } from '@/lib/utils';

export function MapTeaser() {
  const t = useTranslations('Home');
  const locale = useLocale();

  return (
    <Section id="map-teaser">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>{t('mapEyebrow')}</Eyebrow>
          <h2 className="mt-6 text-balance text-4xl font-bold md:text-5xl">{t('mapTitle')}</h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">{t('mapLead')}</p>
          <div className="mt-8">
            <Button href="/find-a-specialist" size="lg">
              <MapPin className="size-4" />
              {t('mapCta')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(61,108,255,0.18),transparent_70%)]" />
            {/* Plotted care centres */}
            {CARE_CENTERS.map((c, i) => (
              <span
                key={c.id}
                title={`${localized(c.name, locale)} — ${localized(c.city, locale)}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${c.pos.x * 100}%`, top: `${c.pos.y * 100}%` }}
              >
                <span
                  className="block rounded-full bg-[var(--color-cyan)]"
                  style={{
                    width: c.flagship ? 12 : 8,
                    height: c.flagship ? 12 : 8,
                    boxShadow: '0 0 14px var(--color-cyan)',
                    animation: `pulseGlow ${2.4 + (i % 4) * 0.4}s ease-in-out infinite`,
                  }}
                />
              </span>
            ))}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-sm">
              <span className="font-semibold text-white">
                {CARE_CENTERS.length}+ {t('centresLabel')}
              </span>
              <span className="text-[var(--color-faint)]">4 {t('provincesLabel')}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
