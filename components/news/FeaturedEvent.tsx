'use client';

import Image from 'next/image';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, MapPin, Mic } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { EventDetails, NewsItem } from '@/data/news';
import { localized } from '@/lib/utils';
import { EventBadge } from './EventStatus';

export function FeaturedEvent({ item }: { item: NewsItem & { event: EventDetails } }) {
  const t = useTranslations('News');
  const format = useFormatter();
  const locale = useLocale();
  const { event } = item;
  const title = localized(item.title, locale);
  const when = `${format.dateTime(new Date(event.start), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${format.dateTimeRange(new Date(event.start), new Date(event.end), { hour: 'numeric', minute: '2-digit' })}`;

  const facts = [
    { Icon: CalendarDays, value: when },
    { Icon: MapPin, value: localized(event.venue, locale) },
    ...(event.speaker ? [{ Icon: Mic, value: localized(event.speaker.name, locale) }] : []),
  ];

  return (
    <Link
      href={`/news/${item.id}`}
      className="group glass relative grid overflow-hidden rounded-[var(--radius-2xl)] transition-all duration-500 hover:-translate-y-1 hover:border-white/25 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-[var(--color-cyan)] opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35"
      />
      <div className="relative aspect-[4/3] overflow-hidden bg-white md:aspect-auto">
        <Image
          src={event.poster}
          alt={t('posterAlt', { title })}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          priority
        />
      </div>
      <div className="relative flex flex-col gap-5 p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <EventBadge end={event.end} />
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            {localized(item.tag, locale)}
          </span>
        </div>
        <h2 className="text-balance text-2xl font-bold leading-tight md:text-4xl">{title}</h2>
        <p className="leading-relaxed text-[var(--color-muted)]">{localized(item.excerpt, locale)}</p>
        <ul className="grid gap-3 text-sm">
          {facts.map(({ Icon, value }) => (
            <li key={value} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-[var(--color-cyan)]" />
              {/* Node and browser ICU differ only in invisible spacing around times. */}
              <span suppressHydrationWarning>{value}</span>
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-white">
          {t('viewDetails')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
