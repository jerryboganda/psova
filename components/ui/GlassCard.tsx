import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({
  children,
  className,
  accent,
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'group glass relative overflow-hidden rounded-[var(--radius-2xl)] p-6 md:p-8',
        interactive &&
          'transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-white/25',
        className,
      )}
      style={
        accent
          ? ({ ['--accent' as string]: accent } as React.CSSProperties)
          : undefined
      }
    >
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-16 size-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
          style={{ background: accent }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
