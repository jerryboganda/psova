import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EventBadge, EventRegistration } from '@/components/news/EventStatus';
import { NEWS } from '@/data/news';
import { localized } from '@/lib/utils';

type Params = Promise<{ locale: string; id: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => NEWS.map((item) => ({ locale, id: item.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const item = NEWS.find((n) => n.id === id);
  if (!item) return {};
  const title = localized(item.title, locale);
  return {
    title,
    description: localized(item.excerpt, locale),
    openGraph: item.event ? { title, images: [item.event.poster] } : undefined,
  };
}

const card = 'rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 md:p-8';

export default async function NewsDetailPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const item = NEWS.find((n) => n.id === id);
  if (!item) notFound();

  const t = await getTranslations('News');
  const format = await getFormatter();
  const title = localized(item.title, locale);
  const { event } = item;

  return (
    <>
      <header className="relative overflow-hidden px-5 pb-8 pt-32 md:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(31,224,212,0.18),transparent_60%),radial-gradient(50%_50%_at_85%_10%,rgba(61,108,255,0.22),transparent_60%)]"
        />
        <div className="mx-auto max-w-5xl">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('backToAll')}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {event && <EventBadge end={event.end} />}
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              {localized(item.tag, locale)}
            </span>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--color-muted)]">
            {localized(item.excerpt, locale)}
          </p>
        </div>
      </header>

      <Section>
        <div className="mx-auto max-w-5xl">
          {event ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              <Reveal>
                <a
                  href={event.poster}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white shadow-[0_30px_80px_-30px_rgba(31,224,212,0.35)] lg:sticky lg:top-28"
                >
                  <Image
                    src={event.poster}
                    alt={t('posterAlt', { title })}
                    width={1131}
                    height={1599}
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="h-auto w-full"
                    priority
                  />
                </a>
              </Reveal>

              <div className="flex flex-col gap-6">
                <div className={`${card} grid gap-5`}>
                  <Fact Icon={CalendarDays} label={t('when')}>
                    {format.dateTime(new Date(event.start), {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    <br />
                    {format.dateTimeRange(new Date(event.start), new Date(event.end), {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Fact>
                  <Fact Icon={MapPin} label={t('where')}>
                    {localized(event.venue, locale)}
                  </Fact>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: t('speaker'), person: event.speaker },
                    { label: t('patron'), person: event.patron },
                  ].map(({ label, person }) => (
                    <div key={label} className={card}>
                      <p className="text-xs uppercase tracking-widest text-[var(--color-cyan)]">
                        {label}
                      </p>
                      <p className="mt-2 font-semibold">{localized(person.name, locale)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                        {localized(person.role, locale)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className={card}>
                  <h2 className="text-lg font-semibold">{t('focus')}</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {event.focus.map((f) => (
                      <li
                        key={f.en}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm"
                      >
                        {localized(f, locale)}
                      </li>
                    ))}
                  </ul>
                  <h2 className="mt-6 flex items-center gap-2 text-lg font-semibold">
                    <Users className="size-5 text-[var(--color-cyan)]" />
                    {t('audience')}
                  </h2>
                  <p className="mt-2 leading-relaxed text-[var(--color-muted)]">
                    {localized(event.audience, locale)}
                  </p>
                </div>

                <div className={`${card} glass`}>
                  <h2 className="mb-4 text-lg font-semibold">{t('register')}</h2>
                  <EventRegistration event={event} title={title} />
                </div>
              </div>
            </div>
          ) : (
            item.body && (
              <p className="text-lg leading-relaxed text-[var(--color-muted)]">
                {localized(item.body, locale)}
              </p>
            )
          )}
        </div>
      </Section>

      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: title,
              description: localized(item.excerpt, locale),
              startDate: event.start,
              endDate: event.end,
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              eventStatus: 'https://schema.org/EventScheduled',
              image: [event.poster],
              location: {
                '@type': 'Place',
                name: localized(event.venue, locale),
                address: 'Multan, Pakistan',
              },
              performer: { '@type': 'Person', name: event.speaker.name.en },
              organizer: { '@type': 'Organization', name: 'Pakistan Society Of Vascular Anomaly' },
              isAccessibleForFree: event.free,
            }),
          }}
        />
      )}
    </>
  );
}

function Fact({
  Icon,
  label,
  children,
}: {
  Icon: typeof CalendarDays;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-[var(--color-cyan)]">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-faint)]">{label}</p>
        <p className="mt-1 font-medium leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
