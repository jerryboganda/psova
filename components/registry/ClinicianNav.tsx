'use client';

import { useTranslations } from 'next-intl';
import { LayoutList, FilePlus } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { LogoutButton } from './LogoutButton';
import { cn } from '@/lib/utils';

export function ClinicianNav() {
  const t = useTranslations('RegistryClinician');
  const pathname = usePathname();

  const links = [
    { href: '/registry/clinician', label: t('nav.cases'), Icon: LayoutList, exact: true },
    { href: '/registry/clinician/new-case', label: t('nav.new'), Icon: FilePlus, exact: false },
  ];

  return (
    <div className="border-b border-white/10 bg-white/[0.02]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <nav className="flex gap-1">
          {links.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand text-white'
                    : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-fg)]',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </div>
    </div>
  );
}
