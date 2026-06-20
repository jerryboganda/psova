import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn('text-gradient', className)}>{children}</span>;
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] backdrop-blur',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--color-cyan)] shadow-[0_0_10px_var(--color-cyan)]" />
      {children}
    </span>
  );
}
