'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Copy,
  Check,
  Landmark,
  Smartphone,
  Wallet,
  Zap,
  Globe,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAYMENT_METHODS } from '@/data/donation';
import { localized, cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  smartphone: Smartphone,
  wallet: Wallet,
  zap: Zap,
  globe: Globe,
  'credit-card': CreditCard,
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations('Donate');
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      // Clipboard unavailable (e.g. non-HTTPS) — the value stays selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={t('copyAria', { label })}
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-[var(--color-muted)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--color-cyan)]"
    >
      {copied ? (
        <Check className="size-3.5 text-[var(--color-cyan)]" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? t('copied') : ''}
      </span>
    </button>
  );
}

export function PaymentMethods() {
  const locale = useLocale();
  const t = useTranslations('Donate');

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {PAYMENT_METHODS.map((m) => {
        const Icon = ICONS[m.icon];
        const hasPlaceholder = m.fields.some((f) => f.placeholder);
        return (
          <GlassCard
            key={m.id}
            accent={m.accent}
            interactive={!m.comingSoon}
            className="flex h-full flex-col"
          >
            <div className="flex items-center gap-3">
              <div
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5"
                style={{ color: m.accent }}
              >
                {Icon && <Icon className="size-5" />}
              </div>
              <h3 className="text-lg font-semibold">{localized(m.name, locale)}</h3>
            </div>

            {m.blurb && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                {localized(m.blurb, locale)}
              </p>
            )}

            {m.comingSoon ? (
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  {t('cardComingSoon')}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                  {t('cardComingSoonNote')}
                </p>
              </div>
            ) : (
              <dl className="mt-4 flex flex-col gap-3">
                {m.fields.map((f) => {
                  const fieldLabel = localized(f.label, locale);
                  return (
                    <div
                      key={fieldLabel}
                      className="flex items-start justify-between gap-3 border-t border-white/5 pt-3 first:border-0 first:pt-0"
                    >
                      <div className="min-w-0">
                        <dt className="text-xs uppercase tracking-widest text-[var(--color-faint)]">
                          {fieldLabel}
                        </dt>
                        <dd
                          dir="ltr"
                          className={cn(
                            'mt-0.5 break-words text-start text-sm text-[var(--color-fg)]',
                            f.placeholder && 'italic text-[var(--color-muted)]',
                          )}
                        >
                          {f.value}
                        </dd>
                      </div>
                      {f.copyable && <CopyButton value={f.value} label={fieldLabel} />}
                    </div>
                  );
                })}
              </dl>
            )}

            {hasPlaceholder && !m.comingSoon && (
              <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                {t('placeholderNote')}
              </p>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
