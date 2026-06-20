'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { CenterCard } from './CenterCard';
import { CARE_CENTERS, PROVINCES } from '@/data/centers';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

const PakistanMap = dynamic(() => import('@/components/three/PakistanMap'), {
  ssr: false,
});

const selectClass =
  'rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--color-fg)] focus:border-[var(--color-cyan)]/60 focus:outline-none [&>option]:bg-[var(--color-base-900)]';

export function DirectoryExplorer() {
  const t = useTranslations('Directory');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('all');
  const [condition, setCondition] = useState('all');
  const [type, setType] = useState('all');
  const [city, setCity] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CARE_CENTERS.filter((c) => {
      if (city && c.city.en !== city) return false;
      if (province !== 'all' && c.province.en !== province) return false;
      if (condition !== 'all' && !c.conditions.includes(condition)) return false;
      if (type !== 'all' && c.type !== type) return false;
      if (q) {
        const hay = `${c.name.en} ${c.name.ur} ${c.city.en} ${c.city.ur}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, province, condition, type, city]);

  return (
    <div className="flex flex-col gap-10">
      {/* Interactive map */}
      <div className="relative h-[420px] overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.02] md:h-[520px]">
        <SceneCanvas cameraPosition={[0, 0, 8]} cameraFov={55}>
          <PakistanMap
            selectedCity={city}
            onSelectCity={(c) => setCity((prev) => (prev === c ? null : c))}
            locale={locale}
          />
        </SceneCanvas>
        <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-widest text-[var(--color-faint)]">
          {t('mapHint')}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="relative min-w-0 flex-1 md:min-w-[16rem]">
            <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-faint)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('searchPlaceholder')}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full border border-white/10 bg-white/5 ps-11 pe-4 py-2.5 text-sm text-white placeholder:text-[var(--color-faint)] focus:border-[var(--color-cyan)]/60 focus:outline-none"
            />
          </div>
          <select aria-label={t('province')} value={province} onChange={(e) => setProvince(e.target.value)} className={selectClass}>
            <option value="all">{t('province')}</option>
            {PROVINCES.map((p) => (
              <option key={p.en} value={p.en}>
                {localized(p, locale)}
              </option>
            ))}
          </select>
          <select aria-label={t('condition')} value={condition} onChange={(e) => setCondition(e.target.value)} className={selectClass}>
            <option value="all">{t('condition')}</option>
            {CONDITIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {localized(c.short, locale)}
              </option>
            ))}
          </select>
          <select aria-label={t('type')} value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="all">{t('type')}</option>
            <option value="public">{t('typePublic')}</option>
            <option value="private">{t('typePrivate')}</option>
            <option value="trust">{t('typeTrust')}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">{t('resultsCount', { count: results.length })}</span>
          {city && (
            <button
              onClick={() => setCity(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-cyan)]/15 px-3 py-1 text-xs font-medium text-[var(--color-cyan)]"
            >
              {localized(
                CARE_CENTERS.find((c) => c.city.en === city)?.city ?? { en: city, ur: city },
                locale,
              )}
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <CenterCard center={c} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">
          {t('noResults')}
        </p>
      )}
    </div>
  );
}
