import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Condition } from '@/data/conditions';
import { localized } from '@/lib/utils';

export function ConditionCard({
  condition,
  locale,
  categoryLabel,
}: {
  condition: Condition;
  locale: string;
  categoryLabel: string;
}) {
  return (
    <Link
      href={`/conditions/${condition.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-white/25"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-12 -top-12 size-36 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: condition.accent }}
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              color: condition.accent,
              background: `color-mix(in srgb, ${condition.accent} 14%, transparent)`,
            }}
          >
            <span className="size-1.5 rounded-full" style={{ background: condition.accent }} />
            {categoryLabel}
          </span>
          <ArrowUpRight className="size-5 text-[var(--color-faint)] transition-all duration-300 group-hover:text-white rtl:-scale-x-100" />
        </div>
        <h3 className="text-xl font-semibold leading-snug">{localized(condition.name, locale)}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {localized(condition.tagline, locale)}
        </p>
      </div>
    </Link>
  );
}
