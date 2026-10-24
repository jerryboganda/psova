import type { ComponentType, ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

/** Number + label tile (UI-SPEC §2), used by public stats + admin overview. */
export function StatCard({
  label,
  value,
  Icon,
  accent = 'var(--color-cyan)',
}: {
  label: string;
  value: ReactNode;
  Icon?: ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <GlassCard interactive={false} accent={accent}>
      {Icon && (
        <div className="mb-3 grid size-10 place-items-center rounded-xl bg-white/5" style={{ color: accent }}>
          <Icon className="size-5" />
        </div>
      )}
      <div className="font-display text-3xl font-bold text-[var(--color-fg)] md:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-[var(--color-muted)]">{label}</div>
    </GlassCard>
  );
}
