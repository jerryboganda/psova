'use client';

import { motion, type Variants } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Eyebrow, GradientText } from '@/components/ui/GradientText';
import { HeroVideo } from './HeroVideo';

const rise: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.12 },
  }),
};

export function Hero() {
  const t = useTranslations('Home');

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pb-16 pt-28">
      {/* Cinematic ink-in-water background */}
      <HeroVideo />

      {/* Brand colour-grade over the footage for cohesion with the palette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-50 mix-blend-soft-light"
        style={{
          background:
            'linear-gradient(120deg, #ff2d9b, #8b3dff 45%, #3d6cff 78%, #1fe0d4)',
        }}
      />

      {/* Legibility: dark tint + scrim behind the headline + edge/bottom vignette
          so the footage never competes with the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 82% 60% at 50% 44%, rgba(5,2,17,0.82), rgba(5,2,17,0.5) 50%, rgba(5,2,17,0.28) 80%), linear-gradient(to bottom, rgba(5,2,17,0.58) 0%, rgba(5,2,17,0.3) 38%, rgba(5,2,17,0.52) 78%, rgba(5,2,17,0.96) 100%), radial-gradient(140% 100% at 50% 50%, transparent 46%, rgba(5,2,17,0.9) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
          <Eyebrow>{t('heroEyebrow')}</Eyebrow>
        </motion.div>

        <motion.h1
          custom={1}
          variants={rise}
          initial="hidden"
          animate="visible"
          className="mt-7 text-balance text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
        >
          {t('heroTitleLine1')}{' '}
          <GradientText>{t('heroTitleEmphasis')}</GradientText>
          <br className="hidden sm:block" /> {t('heroTitleLine2')}
        </motion.h1>

        <motion.p
          custom={2}
          variants={rise}
          initial="hidden"
          animate="visible"
          className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-muted)] md:text-xl"
        >
          {t('heroLead')}
        </motion.p>

        <motion.div
          custom={3}
          variants={rise}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button href="/find-a-specialist" size="lg">
            <MapPin className="size-4" />
            {t('heroCtaPrimary')}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Button>
          <Button href="/conditions" variant="glass" size="lg">
            {t('heroCtaSecondary')}
          </Button>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-faint)] [@media(max-height:780px)]:hidden"
      >
        {t('scrollHint')}
        <ChevronDown className="size-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
