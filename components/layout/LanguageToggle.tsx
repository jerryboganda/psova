'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'ur', label: 'اردو' },
] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 backdrop-blur',
        pending && 'opacity-60',
        className,
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchTo(l.code)}
          aria-pressed={locale === l.code}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            locale === l.code
              ? 'bg-brand text-white'
              : 'text-[var(--color-muted)] hover:text-white',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
