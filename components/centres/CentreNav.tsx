'use client';

import { useTranslations } from 'next-intl';
import { BadgeCheck, Building2, CreditCard, FileBadge, LayoutDashboard, QrCode, Users } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { LogoutButton } from '@/components/registry/LogoutButton';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/centre', key: 'overview', Icon: LayoutDashboard, exact: true, ownerOnly: false },
  { href: '/centre/staff', key: 'staff', Icon: Users, exact: false, ownerOnly: true },
  { href: '/centre/profile', key: 'profile', Icon: Building2, exact: false, ownerOnly: true },
  { href: '/centre/membership', key: 'membership', Icon: CreditCard, exact: false, ownerOnly: true },
  { href: '/centre/poster', key: 'poster', Icon: QrCode, exact: false, ownerOnly: false },
  { href: '/centre/certificate', key: 'certificate', Icon: FileBadge, exact: false, ownerOnly: false },
] as const;

export function CentreNav({ isOwner, centreName }: { isOwner: boolean; centreName: string }) {
  const t = useTranslations('Centres.nav');
  const pathname = usePathname();

  return (
    <div className="border-b border-white/10 bg-white/[0.02] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <BadgeCheck className="size-4 text-[var(--color-cyan)]" />
            <span className="max-w-[14rem] truncate">{centreName}</span>
          </span>
          <nav className="flex flex-wrap gap-1">
            {LINKS.filter((l) => isOwner || !l.ownerOnly).map(({ href, key, Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-brand text-white' : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]',
                  )}
                >
                  <Icon className="size-4" />
                  {t(key)}
                </Link>
              );
            })}
          </nav>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
