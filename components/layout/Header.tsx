'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, Heart } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV, NAV_CTA, isGroup, type NavEntry } from '@/data/navigation';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { LanguageToggle } from './LanguageToggle';
import { Magnetic } from '@/components/ui/Magnetic';

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function DesktopNav() {
  const t = useTranslations('Nav');
  const isActive = useActive();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {NAV.map((entry: NavEntry) => {
        if (isGroup(entry)) {
          const active = entry.children.some((c) => isActive(c.href));
          return (
            <div
              key={entry.key}
              className="relative"
              onMouseEnter={() => setOpen(entry.key)}
              onMouseLeave={() => setOpen((o) => (o === entry.key ? null : o))}
            >
              <button
                className={cn(
                  'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'text-white' : 'text-[var(--color-muted)] hover:text-white',
                )}
                aria-expanded={open === entry.key}
              >
                {t(entry.key)}
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
              <AnimatePresence>
                {open === entry.key && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="glass-strong absolute start-0 top-full mt-2 min-w-56 rounded-2xl p-2"
                  >
                    {entry.children.map((child) => (
                      <Link
                        key={child.key}
                        href={child.href}
                        className={cn(
                          'block rounded-xl px-4 py-2.5 text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-white/10 text-white'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white',
                        )}
                      >
                        {t(child.key)}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }
        return (
          <Link
            key={entry.key}
            href={entry.href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive(entry.href)
                ? 'text-white'
                : 'text-[var(--color-muted)] hover:text-white',
            )}
          >
            {t(entry.key)}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const off = locale === 'ur' ? '-100%' : '100%';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] lg:hidden"
    >
      <div className="absolute inset-0 bg-[var(--color-base-950)]/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ x: off }}
        animate={{ x: 0 }}
        exit={{ x: off }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="glass-strong absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col gap-1 overflow-y-auto p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} aria-label={t('close')} className="rounded-full p-2 hover:bg-white/10">
            <X className="size-6" />
          </button>
        </div>
        {NAV.map((entry) =>
          isGroup(entry) ? (
            <div key={entry.key} className="mt-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)]">
                {t(entry.key)}
              </p>
              {entry.children.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  onClick={onClose}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--color-fg)] hover:bg-white/5"
                >
                  {t(c.key)}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={entry.key}
              href={entry.href}
              onClick={onClose}
              className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--color-fg)] hover:bg-white/5"
            >
              {t(entry.key)}
            </Link>
          ),
        )}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-5">
          <LanguageToggle className="self-start" />
          <Link
            href={NAV_CTA.contact}
            onClick={onClose}
            className="glass rounded-full px-6 py-3 text-center text-sm font-semibold"
          >
            {t('contact')}
          </Link>
          <Link
            href={NAV_CTA.donate}
            onClick={onClose}
            className="bg-brand rounded-full px-6 py-3 text-center text-sm font-semibold text-white"
          >
            {t('donate')}
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Header() {
  const t = useTranslations('Nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[60] px-3 transition-all duration-500 sm:px-4',
          scrolled ? 'py-2' : 'py-4',
        )}
      >
        <div
          className={cn(
            'mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-full px-4 transition-all duration-500 md:px-5',
            scrolled ? 'glass-strong py-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]' : 'py-2',
          )}
        >
          <Logo className="justify-self-start" />
          <DesktopNav />
          <div className="flex items-center justify-self-end gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link
              href={NAV_CTA.contact}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-white lg:inline-flex"
            >
              {t('contact')}
            </Link>
            <Magnetic className="hidden lg:block">
              <Link
                href={NAV_CTA.donate}
                className="bg-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_rgba(255,45,155,0.7)]"
              >
                <Heart className="size-4" />
                {t('donate')}
              </Link>
            </Magnetic>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={t('openMenu')}
              className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  );
}
