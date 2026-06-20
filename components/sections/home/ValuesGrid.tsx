'use client';

import { useLocale, useTranslations } from 'next-intl';
import { HeartHandshake, MapPin, Microscope, Users, type LucideIcon } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Stagger, StaggerItem } from '@/components/ui/Reveal';
import { VALUES } from '@/data/site';
import { localized } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  'heart-handshake': HeartHandshake,
  'map-pin': MapPin,
  microscope: Microscope,
  users: Users,
};

export function ValuesGrid() {
  const t = useTranslations('Home');
  const locale = useLocale();

  return (
    <Section id="values">
      <SectionHeading eyebrow={t('valuesEyebrow')} title={t('valuesTitle')} />
      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((v) => {
          const Icon = ICONS[v.icon] ?? HeartHandshake;
          return (
            <StaggerItem key={v.icon}>
              <div className="group flex h-full flex-col rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/25">
                <div className="grid size-12 place-items-center rounded-xl bg-white/5 text-[var(--color-cyan)] transition-colors group-hover:bg-[var(--color-cyan)]/15">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{localized(v.title, locale)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {localized(v.body, locale)}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
