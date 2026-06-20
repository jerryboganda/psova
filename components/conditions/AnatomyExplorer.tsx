'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Button } from '@/components/ui/Button';
import { CONDITIONS, getCondition } from '@/data/conditions';
import { localized } from '@/lib/utils';

const AnatomyFigure = dynamic(() => import('@/components/three/AnatomyFigure'), {
  ssr: false,
});

export function AnatomyExplorer() {
  const t = useTranslations('Conditions');
  const tc = useTranslations('Common');
  const locale = useLocale();
  const [selected, setSelected] = useState<string | null>('infantile-hemangioma');
  const c = selected ? getCondition(selected) : null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="relative h-[460px] overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.02] md:h-[560px]">
        <SceneCanvas cameraPosition={[0, 0, 6.5]} cameraFov={50}>
          <AnatomyFigure selected={selected} onSelect={setSelected} />
        </SceneCanvas>
        <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-widest text-[var(--color-faint)]">
          {t('explorerHint')}
        </span>
      </div>

      <div className="min-h-[320px]">
        <AnimatePresence mode="wait">
          {c && (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 md:p-8"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  color: c.accent,
                  background: `color-mix(in srgb, ${c.accent} 14%, transparent)`,
                }}
              >
                <span className="size-1.5 rounded-full" style={{ background: c.accent }} />
                {c.category === 'tumor' ? t('categoryTumor') : t('categoryMalformation')}
              </span>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">
                {localized(c.name, locale)}
              </h3>
              <p className="mt-2 text-[var(--color-muted)]">{localized(c.tagline, locale)}</p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                {localized(c.summary, locale)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {c.signs.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]"
                  >
                    {localized(s, locale)}
                  </span>
                ))}
              </div>
              <div className="mt-7">
                <Button href={`/conditions/${c.slug}`} size="sm">
                  {tc('learnMore')}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.slug}
              onClick={() => setSelected(cond.slug)}
              className="rounded-full border px-3 py-1 text-xs transition-colors"
              style={{
                borderColor:
                  selected === cond.slug ? cond.accent : 'rgba(255,255,255,0.1)',
                color: selected === cond.slug ? cond.accent : 'var(--color-faint)',
              }}
            >
              {localized(cond.short, locale)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
