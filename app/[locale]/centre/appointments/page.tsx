import { headers } from 'next/headers';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { AppointmentActions } from '@/components/centres/AppointmentActions';
import { WhatsAppButtons } from '@/components/centres/WhatsAppButtons';
import { listAppointments, type AppointmentScope } from '@/lib/registry/centre-journey';
import { centrePageContext } from '@/lib/registry/centre-page';
import { CENTRE_TIME_ZONE } from '@/lib/registry/constants';
import { clientIpFromHeaders } from '@/lib/registry/guards';
import { firstToken } from '@/lib/registry/patients';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SCOPES: AppointmentScope[] = ['today', 'upcoming', 'overdue'];

export default async function CentreAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { scope: scopeParam } = await searchParams;
  const scope = SCOPES.find((s) => s === scopeParam) ?? 'today';
  const { user, center } = await centrePageContext(locale);
  const t = await getTranslations('Centres.appointments');
  const rows = await listAppointments(center, scope, { actorId: user.id, ip: clientIpFromHeaders(await headers()) });

  // Reminder / missed-visit texts, prepared in both languages for the WhatsApp buttons.
  const centreName = { en: center.nameEn, ur: center.nameUr || center.nameEn };
  const text = async (lang: 'en' | 'ur', key: 'appointment' | 'missed', row: (typeof rows)[number]) => {
    const tw = await getTranslations({ locale: lang, namespace: 'Centres.wa' });
    const tk = await getTranslations({ locale: lang, namespace: 'Centres.appointments' });
    const fmt = await getFormatter({ locale: lang });
    return tw(key, {
      name: firstToken(row.patientName),
      centre: centreName[lang],
      kind: tk(`kinds.${row.kind}`),
      when: fmt.dateTime(new Date(row.startsAt), { dateStyle: 'medium', timeStyle: 'short', timeZone: CENTRE_TIME_ZONE }),
    });
  };
  const format = await getFormatter();

  const items = await Promise.all(
    rows.map(async (r) => {
      const key = scope === 'overdue' ? 'missed' : 'appointment';
      return { r, key, texts: { en: await text('en', key, r), ur: await text('ur', key, r) } } as const;
    }),
  );

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-6 text-[var(--color-muted)]">{t('lede')}</p>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {SCOPES.map((s) => (
          <Link
            key={s}
            href={`/centre/appointments?scope=${s}`}
            role="tab"
            aria-selected={scope === s}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              scope === s ? 'bg-brand text-white' : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            {t(`scopes.${s}`)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t(`empty.${scope}`)}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ r, key, texts }) => (
            <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    <Link href={`/centre/patients/${r.patientId}`} className="hover:underline">{r.patientName}</Link>
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {format.dateTime(new Date(r.startsAt), { dateStyle: 'medium', timeStyle: 'short', timeZone: CENTRE_TIME_ZONE })}
                    {' · '}
                    {t(`kinds.${r.kind}`)}
                  </p>
                  {r.note && <p className="mt-1 text-xs text-[var(--color-faint)]">{r.note}</p>}
                </div>
                <AppointmentActions id={r.id} status={r.status} />
              </div>
              {r.status === 'SCHEDULED' && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[var(--color-faint)]">{t(key === 'missed' ? 'waMissed' : 'waReminder')}</p>
                  {r.consentContact ? (
                    <WhatsAppButtons patientId={r.patientId} phone={r.phone} template={key} texts={texts} />
                  ) : (
                    <p className="text-xs text-[var(--color-muted)]">{t('waNoConsent')}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
