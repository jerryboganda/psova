'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { brandButtonClass } from './field';

/**
 * Controlled multi-step wizard chrome (UI-SPEC §2/§5): gradient progress, step
 * indicator with aria-current, animated step transitions, back/next, and focus
 * moved to the step heading on each change.
 */
export function WizardShell({
  step,
  total,
  stepTitle,
  stepLabels,
  onBack,
  onNext,
  isLast = false,
  submitting = false,
  submitLabel,
  children,
}: {
  step: number; // 1-based
  total: number;
  stepTitle: string;
  stepLabels: string[];
  onBack: () => void;
  onNext: () => void;
  isLast?: boolean;
  submitting?: boolean;
  submitLabel: string;
  children: ReactNode;
}) {
  const tc = useTranslations('RegistryCommon');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const pct = Math.round((step / total) * 100);

  return (
    <div>
      {/* progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--color-faint)]">
          <span>
            {tc('page')} {step} {tc('of')} {total}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* step indicator */}
      <ol className="mb-8 flex flex-wrap gap-2" aria-label={stepTitle}>
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li
              key={label}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active && 'border-[var(--color-cyan)]/50 bg-[var(--color-cyan)]/10 text-[var(--color-fg)]',
                done && 'border-white/10 bg-white/5 text-[var(--color-muted)]',
                !active && !done && 'border-white/10 text-[var(--color-faint)]',
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full text-[10px] font-bold',
                  active ? 'bg-brand text-white' : 'bg-white/10',
                )}
              >
                {n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </li>
          );
        })}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="mb-6 text-xl font-bold outline-none md:text-2xl">
        {stepTitle}
      </h2>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* nav */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1 || submitting}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[var(--color-fg)] transition-colors hover:bg-white/10',
            step === 1 && 'invisible',
          )}
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {tc('back')}
        </button>

        <button type="button" onClick={onNext} disabled={submitting} className={brandButtonClass}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isLast ? null : (
            <ArrowRight className="order-last size-4 rtl:-scale-x-100" />
          )}
          {isLast ? submitLabel : tc('next')}
        </button>
      </div>
    </div>
  );
}
