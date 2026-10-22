'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { NewsCard } from '@/components/news/NewsCard';
import { FeaturedEvent } from '@/components/news/FeaturedEvent';
import { NEWS, type EventDetails, type NewsItem } from '@/data/news';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'news' | 'event' | 'story';

// The newest event with full details is shown as a banner above the grid.
const FEATURED = NEWS.find((item): item is NewsItem & { event: EventDetails } => !!item.event);
const REST = NEWS.filter((item) => item !== FEATURED);

const TABS: { key: Tab; labelKey: 'all' | 'news' | 'events' | 'stories' }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'news', labelKey: 'news' },
  { key: 'event', labelKey: 'events' },
  { key: 'story', labelKey: 'stories' },
];

export function NewsList() {
  const t = useTranslations('News');
  const [active, setActive] = useState<Tab>('all');

  const items = active === 'all' ? REST : REST.filter((item: NewsItem) => item.kind === active);

  return (
    <div className="flex flex-col gap-10">
      {FEATURED && <FeaturedEvent item={FEATURED} />}

      {REST.length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5 self-center backdrop-blur">
            {TABS.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand text-white' : 'text-[var(--color-muted)] hover:text-white',
                  )}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
