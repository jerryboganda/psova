import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Status = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';

const styles: Record<Status, string> = {
  PENDING: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  VERIFIED: 'border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]',
  REJECTED: 'border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 text-[var(--color-rose)]',
  DUPLICATE: 'border-white/15 bg-white/5 text-[var(--color-faint)]',
};

/** Status pill (UI-SPEC §2). Works in server and client components (next-intl). */
export function RegistryBadge({ status, className }: { status: Status; className?: string }) {
  const t = useTranslations('RegistryCommon');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {t(`statuses.${status}`)}
    </span>
  );
}
