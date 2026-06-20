'use client';

import { MapPin, Phone, ExternalLink, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CareCenter } from '@/data/centers';
import { localized } from '@/lib/utils';

const TYPE_KEY: Record<CareCenter['type'], 'typePublic' | 'typePrivate' | 'typeTrust'> = {
  public: 'typePublic',
  private: 'typePrivate',
  trust: 'typeTrust',
};

export function CenterCard({ center }: { center: CareCenter }) {
  const t = useTranslations('Directory');
  const locale = useLocale();

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/25">
      {center.flagship && (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--color-cyan)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-cyan)]">
          <Star className="size-3" />
          {t('flagship')}
        </span>
      )}
      <h3 className="text-lg font-semibold leading-snug">
        {localized(center.name, locale)}
      </h3>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
        <MapPin className="size-4 text-[var(--color-cyan)]" />
        {localized(center.city, locale)} · {localized(center.province, locale)}
      </p>

      <span className="mt-3 inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[var(--color-faint)]">
        {t(TYPE_KEY[center.type])}
      </span>

      <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
        {center.services.slice(0, 4).map((s, i) => (
          <span
            key={i}
            className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-[var(--color-muted)]"
          >
            {localized(s, locale)}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <a
          href={`tel:${center.phone}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
        >
          <Phone className="size-4" />
          {t('callCta')}
        </a>
        {center.website && (
          <a
            href={center.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
          >
            <ExternalLink className="size-4" />
            {t('websiteCta')}
          </a>
        )}
      </div>
    </div>
  );
}
