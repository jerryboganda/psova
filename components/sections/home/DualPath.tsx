'use client';

import { HeartPulse, Stethoscope, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function DualPath() {
  const t = useTranslations('Home');

  const cards = [
    {
      href: '/patients',
      Icon: HeartPulse,
      title: t('patientsCardTitle'),
      body: t('patientsCardBody'),
      cta: t('patientsCta'),
      accent: '#ff2d9b',
    },
    {
      href: '/professionals',
      Icon: Stethoscope,
      title: t('prosCardTitle'),
      body: t('prosCardBody'),
      cta: t('prosCta'),
      accent: '#3d6cff',
    },
  ];

  return (
    <Section id="paths">
      <SectionHeading eyebrow={t('dualEyebrow')} title={t('dualTitle')} />
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 0.12}>
            <Link
              href={c.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-white/25 md:p-10"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -end-16 -top-16 size-52 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                style={{ background: c.accent }}
              />
              <div
                className="relative z-10 grid size-14 place-items-center rounded-2xl"
                style={{ background: `color-mix(in srgb, ${c.accent} 18%, transparent)`, color: c.accent }}
              >
                <c.Icon className="size-7" />
              </div>
              <h3 className="relative z-10 mt-6 text-2xl font-semibold md:text-3xl">{c.title}</h3>
              <p className="relative z-10 mt-3 flex-1 text-base leading-relaxed text-[var(--color-muted)]">
                {c.body}
              </p>
              <span className="relative z-10 mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                {c.cta}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
