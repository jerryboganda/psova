'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, MessageCircle, Phone } from 'lucide-react';
import type { EventDetails } from '@/data/news';
import { localized } from '@/lib/utils';

// Pages are statically built, so "past" is decided in the browser, not at build time.
export function useEventPast(end: string) {
  const [past, setPast] = useState(false);
  useEffect(() => setPast(Date.now() > new Date(end).getTime()), [end]);
  return past;
}

export function EventBadge({ end }: { end: string }) {
  const t = useTranslations('News');
  const past = useEventPast(end);
  return (
    <span
      className={
        past
          ? 'inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[var(--color-muted)]'
          : 'inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)] px-3 py-1 text-xs font-medium text-[var(--color-cyan)]'
      }
    >
      {!past && <span className="size-1.5 animate-pulse rounded-full bg-[var(--color-cyan)]" />}
      {past ? t('past') : t('upcoming')}
    </span>
  );
}

const gcalDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');

export function EventRegistration({ event, title }: { event: EventDetails; title: string }) {
  const t = useTranslations('News');
  const locale = useLocale();
  const past = useEventPast(event.end);

  if (past) {
    return <p className="text-sm leading-relaxed text-[var(--color-muted)]">{t('eventEnded')}</p>;
  }

  const digits = event.contact.phone.replace(/\D/g, '');
  const calendar = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${gcalDate(event.start)}/${gcalDate(event.end)}`,
    location: localized(event.venue, locale),
  })}`;
  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5';

  return (
    <div>
      {event.free && (
        <p className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">{t('registerFree')}</span>
        </p>
      )}
      <p className="mt-3 text-xs uppercase tracking-widest text-[var(--color-faint)]">
        {t('registerContact')}
      </p>
      <p className="mt-1 font-medium">
        {localized(event.contact.name, locale)}{' '}
        <bdi dir="ltr" className="text-[var(--color-muted)]">
          {event.contact.phone.replace(/^\+92(\d{3})(\d{7})$/, '+92 $1 $2')}
        </bdi>
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`tel:${event.contact.phone}`} className={`${btn} bg-brand text-white`}>
          <Phone className="size-4" />
          {t('call')}
        </a>
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noreferrer"
          className={`${btn} glass hover:border-white/25`}
        >
          <MessageCircle className="size-4" />
          {t('whatsapp')}
        </a>
        <a href={calendar} target="_blank" rel="noreferrer" className={`${btn} glass hover:border-white/25`}>
          <CalendarPlus className="size-4" />
          {t('addToCalendar')}
        </a>
      </div>
    </div>
  );
}
