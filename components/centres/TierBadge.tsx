import { Award, BadgeCheck, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const STYLE = {
  MEMBER: { Icon: BadgeCheck, cls: 'bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]' },
  ACCREDITED: { Icon: ShieldCheck, cls: 'bg-violet-400/15 text-violet-300' },
  EXCELLENCE: { Icon: Award, cls: 'bg-amber-400/15 text-amber-300' },
} as const;

/** PSOVA network badge: "Member Centre" / "Accredited Centre" / "Centre of Excellence". */
export function TierBadge({ tier, className }: { tier: keyof typeof STYLE; className?: string }) {
  const t = useTranslations('Centres.tiers');
  const { Icon, cls } = STYLE[tier];
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
        cls,
        className,
      )}
    >
      <Icon className="size-3" />
      {t(tier)}
    </span>
  );
}
