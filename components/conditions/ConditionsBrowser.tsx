'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { CONDITIONS } from '@/data/conditions';
import { ConditionCard } from './ConditionCard';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'tumor' | 'malformation';

export function ConditionsBrowser() {
  const t = useTranslations('Conditions');
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>('all');

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'tumor', label: t('filterTumors') },
    { key: 'malformation', label: t('filterMalformations') },
  ];

  const items = CONDITIONS.filter((c) => filter === 'all' || c.category === filter);

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-full border px-5 py-2 text-sm font-medium transition-all',
              filter === tab.key
                ? 'bg-brand border-transparent text-white'
                : 'border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <motion.div
            key={c.slug}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <ConditionCard
              condition={c}
              locale={locale}
              categoryLabel={c.category === 'tumor' ? t('categoryTumor') : t('categoryMalformation')}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
