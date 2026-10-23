'use client';

import { useTranslations } from 'next-intl';
import { LayoutDashboard, ListChecks, Database, UserCheck, Building2, HandHeart, MessagesSquare, ScrollText } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { LogoutButton } from './LogoutButton';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const t = useTranslations('RegistryAdmin');
  const pathname = usePathname();

  const links = [
    { href: '/registry/admin', label: t('nav.overview'), Icon: LayoutDashboard, exact: true },
    { href: '/registry/admin/queue', label: t('nav.queue'), Icon: ListChecks, exact: false },
    { href: '/registry/admin/records', label: t('nav.records'), Icon: Database, exact: false },
    { href: '/registry/admin/clinicians', label: t('nav.clinicians'), Icon: UserCheck, exact: false },
    { href: '/registry/admin/centres', label: t('nav.centres'), Icon: Building2, exact: false },
    { href: '/registry/admin/support', label: t('nav.support'), Icon: HandHeart, exact: false },
    { href: '/registry/admin/mdt', label: t('nav.mdt'), Icon: MessagesSquare, exact: false },
    { href: '/registry/admin/audit', label: t('nav.audit'), Icon: ScrollText, exact: false },
  ];

  return (
    <div className="border-b border-white/10 bg-white/[0.02]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-1">
          {links.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
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
