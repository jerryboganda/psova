import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, CalendarClock, ClipboardPlus, Clock, FileImage, FileText, Syringe } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { RecordView } from '@/components/registry/RecordView';
import { AppointmentForm } from '@/components/centres/AppointmentForm';
import { DocumentDeleteButton } from '@/components/centres/DocumentDeleteButton';
import { DocumentUpload } from '@/components/centres/DocumentUpload';
import { WhatsAppButtons } from '@/components/centres/WhatsAppButtons';
import { getJourney } from '@/lib/registry/centre-journey';
import { listDocuments } from '@/lib/registry/centre-documents';
import { uploadsConfigured } from '@/lib/registry/storage';
import { getCentrePatient } from '@/lib/registry/centre-patients';
import { centrePageContext } from '@/lib/registry/centre-page';
import { CENTRE_TIME_ZONE } from '@/lib/registry/constants';
import { clientIpFromHeaders } from '@/lib/registry/guards';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { firstToken } from '@/lib/registry/patients';

export const dynamic = 'force-dynamic';

export default async function CentrePatientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user, member, center, state } = await centrePageContext(locale);
  const h = await headers();
  const record = await getCentrePatient(center, id, { actorId: user.id, role: member.role, ip: clientIpFromHeaders(h) });
  if (!record) notFound();
  const journey = await getJourney(center, id, member.role);
  // Photos and reports are clinical: reception does not see them.
  const clinical = member.role !== 'RECEPTION';
  const documents = clinical ? await listDocuments(center, id) : [];
  const canDeleteDocs = member.role === 'OWNER' || member.role === 'DOCTOR';

  const t = await getTranslations('Centres.patients');
  const tv = await getTranslations('Centres.visit');
  const ta = await getTranslations('Centres.appointments');
  const tc = await getTranslations('RegistryCommon');
  const td = await getTranslations('Centres.documents');
  const format = await getFormatter();
  const canWrite = membershipAllowsWrites(state);
  const canVisit = canWrite && member.role !== 'RECEPTION';

  // WhatsApp text is prepared in both languages whatever the staff member's own locale.
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psova.org.pk').replace(/\/$/, '');
  const centreName = { en: center.nameEn, ur: center.nameUr || center.nameEn };
  const message = async (lang: 'en' | 'ur') =>
    (await getTranslations({ locale: lang, namespace: 'Centres.wa' }))('trackingCode', {
      name: firstToken(record.fullName),
      centre: centreName[lang],
      code: record.trackingCode,
      url: `${site}/${lang}/registry/status`,
    });
  const texts = { en: await message('en'), ur: await message('ur') };

  const when = (iso: string, time: boolean) =>
    format.dateTime(new Date(iso), { dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}), timeZone: CENTRE_TIME_ZONE });

  type Entry =
    | { at: string; kind: 'registered' }
    | { at: string; kind: 'visit'; v: (typeof journey.encounters)[number] }
    | { at: string; kind: 'appointment'; a: (typeof journey.appointments)[number] };
  const timeline: Entry[] = [
    { at: record.createdAt, kind: 'registered' as const },
    ...journey.encounters.map((v) => ({ at: v.date, kind: 'visit' as const, v })),
    ...journey.appointments.map((a) => ({ at: a.startsAt, kind: 'appointment' as const, a })),
  ].sort((x, y) => Date.parse(y.at) - Date.parse(x.at));

  const dot = 'absolute -start-[1.3rem] top-1.5 size-2 rounded-full';
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <Section>
      <Link href="/centre/patients" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {t('back')}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{record.fullName}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            <span dir="ltr" className="font-mono">{record.trackingCode}</span>
            {record.mrn && <> · {t('mrn')}: <span dir="ltr" className="font-mono">{record.mrn}</span></>}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {canVisit && (
            <Link href={`/centre/patients/${id}/visit`} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
              <ClipboardPlus className="size-4" />
              {tv('add')}
            </Link>
          )}
          <div>
            <p className="mb-2 text-xs text-[var(--color-faint)]">{t('waTitle')}</p>
            <WhatsAppButtons patientId={record.id} phone={record.phone} template="trackingCode" texts={texts} />
          </div>
        </div>
      </div>

      <RecordView
        record={record}
        actions={
          <>
            {canWrite && (
              <GlassCard interactive={false}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <CalendarClock className="size-5 text-[var(--color-cyan)]" />
                  {ta('bookTitle')}
                </h2>
                <AppointmentForm patientId={id} />
              </GlassCard>
            )}

            {clinical && (
              <GlassCard interactive={false}>
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <FileImage className="size-5 text-[var(--color-cyan)]" />
                  {td('title')}
                </h2>
                <p className="mb-4 text-xs text-[var(--color-faint)]">{td('lede')}</p>
                {documents.length === 0 ? (
                  <p className="mb-4 text-sm text-[var(--color-muted)]">{td('empty')}</p>
                ) : (
                  <ul className="mb-5 flex flex-col gap-3">
                    {documents.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="size-5 shrink-0 text-[var(--color-cyan)]" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{d.fileName}</p>
                            <p className="text-xs text-[var(--color-faint)]">
                              {td(`kinds.${d.kind}`)} · {kb(d.size)} · {when(d.createdAt, false)}
                              {d.consentForTeaching && <> · {td('teachingBadge')}</>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/centre/documents/${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                          >
                            {d.mime.startsWith('image/') ? td('open') : td('download')}
                          </a>
                          {canDeleteDocs && canWrite && <DocumentDeleteButton id={d.id} />}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {canWrite && (uploadsConfigured() ? <DocumentUpload patientId={id} /> : <p className="text-sm text-amber-200">{td('notConfigured')}</p>)}
              </GlassCard>
            )}

            <GlassCard interactive={false}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Clock className="size-5 text-[var(--color-cyan)]" />
                {t('timeline.title')}
              </h2>
              <ol className="flex flex-col gap-5 border-s border-white/10 ps-4">
                {timeline.map((e) => {
                  if (e.kind === 'registered') {
                    return (
                      <li key="registered" className="relative text-sm">
                        <span className={`${dot} bg-white/40`} aria-hidden />
                        <p className="font-medium">{record.source === 'SELF' ? t('timeline.intakeQr') : t('timeline.addedByStaff')}</p>
                        <p className="text-xs text-[var(--color-faint)]">{when(e.at, true)}</p>
                      </li>
                    );
                  }
                  if (e.kind === 'appointment') {
                    return (
                      <li key={`a-${e.a.id}`} className="relative text-sm">
                        <span className={`${dot} bg-amber-300`} aria-hidden />
                        <p className="font-medium">
                          {ta(`kinds.${e.a.kind}`)} <span className="text-xs font-normal text-[var(--color-muted)]">· {ta(`statuses.${e.a.status}`)}</span>
                        </p>
                        <p className="text-xs text-[var(--color-faint)]">{when(e.at, true)}</p>
                        {e.a.note && <p className="mt-1 text-xs text-[var(--color-muted)]">{e.a.note}</p>}
                      </li>
                    );
                  }
                  const v = e.v;
                  return (
                    <li key={`v-${v.id}`} className="relative text-sm">
                      <span className={`${dot} bg-[var(--color-cyan)]`} aria-hidden />
                      <p className="font-medium">
                        {tv('visit')}
                        {v.responseScore && (
                          <span className="ms-2 rounded-full bg-[var(--color-cyan)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-cyan)]">
                            {tv(`responses.${v.responseScore}`)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-faint)]">
                        {when(e.at, false)}
                        {v.authorName && <> · {v.authorName}</>}
                        {v.lesionSizeCm != null && <> · {tv('size')}: <span dir="ltr">{v.lesionSizeCm}</span></>}
                        {v.painScore != null && <> · {tv('pain')}: <span dir="ltr">{v.painScore}/10</span></>}
                      </p>
                      {v.notes && <p className="mt-2 whitespace-pre-wrap text-[var(--color-muted)]">{v.notes}</p>}
                      {v.plan && (
                        <p className="mt-2 whitespace-pre-wrap text-[var(--color-muted)]">
                          <span className="font-medium text-[var(--color-fg)]">{tv('plan')}: </span>
                          {v.plan}
                        </p>
                      )}
                      {v.treatments.map((tr) => (
                        <div key={tr.id} className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                          <p className="flex items-center gap-1.5 font-semibold text-[var(--color-fg)]">
                            <Syringe className="size-3.5 text-[var(--color-cyan)]" />
                            {tc(`treatmentTypes.${tr.type}`)} · {tc(`outcomes.${tr.outcome}`)}
                          </p>
                          {(tr.drug || tr.dose) && <p className="mt-1 text-[var(--color-muted)]">{[tr.drug, tr.dose].filter(Boolean).join(' · ')}</p>}
                          {tr.complications && <p className="mt-1 text-[var(--color-rose)]">{tv('complications')}: {tr.complications}</p>}
                        </div>
                      ))}
                      {v.nextReviewDate && (
                        <p className="mt-2 text-xs text-[var(--color-faint)]">{tv('nextReview')}: {when(v.nextReviewDate, false)}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </GlassCard>
          </>
        }
      />
    </Section>
  );
}
