'use client';

import { useFormatter, useLocale } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { NewsItem } from '@/data/news';
import { localized } from '@/lib/utils';

const KIND_ACCENT: Record<NewsItem['kind'], string> = {
  news: '#3d6cff',
  event: '#1fe0d4',
  story: '#ff2d9b',
};

export function NewsCard({ item }: { item: NewsItem }) {
  const format = useFormatter();
  const locale = useLocale();
  const accent = KIND_ACCENT[item.kind];
  const date = format.dateTime(new Date(item.date), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href="/news"
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/25"
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          {localized(item.tag, locale)}
        </span>
        <ArrowUpRight className="size-5 text-[var(--color-faint)] transition-colors group-hover:text-white rtl:-scale-x-100" />
      </div>
      <time className="text-xs text-[var(--color-faint)]">{date}</time>
      <h3 className="mt-2 text-lg font-semibold leading-snug">{localized(item.title, locale)}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
        {localized(item.excerpt, locale)}
      </p>
    </Link>
  );
}
