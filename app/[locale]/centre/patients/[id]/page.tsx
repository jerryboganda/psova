import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Clock } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { RecordView } from '@/components/registry/RecordView';
import { WhatsAppButtons } from '@/components/centres/WhatsAppButtons';
import { getCentrePatient } from '@/lib/registry/centre-patients';
import { centrePageContext } from '@/lib/registry/centre-page';
import { clientIpFromHeaders } from '@/lib/registry/guards';
import { firstToken } from '@/lib/registry/patients';

export const dynamic = 'force-dynamic';

export default async function CentrePatientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user, member, center } = await centrePageContext(locale);
  const h = await headers();
  const record = await getCentrePatient(center, id, { actorId: user.id, role: member.role, ip: clientIpFromHeaders(h) });
  if (!record) notFound();

  const t = await getTranslations('Centres.patients');
  const format = await getFormatter();
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
        <div>
          <p className="mb-2 text-xs text-[var(--color-faint)]">{t('waTitle')}</p>
          <WhatsAppButtons patientId={record.id} phone={record.phone} template="trackingCode" texts={texts} />
        </div>
      </div>

      <RecordView
        record={record}
        actions={
          <GlassCard interactive={false}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Clock className="size-5 text-[var(--color-cyan)]" />
              {t('timeline.title')}
            </h2>
            <ol className="flex flex-col gap-3 border-s border-white/10 ps-4">
              <li className="relative text-sm">
                <span className="absolute -start-[1.3rem] top-1.5 size-2 rounded-full bg-[var(--color-cyan)]" aria-hidden />
                <p className="font-medium">{record.source === 'SELF' ? t('timeline.intakeQr') : t('timeline.addedByStaff')}</p>
                <p className="text-xs text-[var(--color-faint)]">
                  {format.dateTime(new Date(record.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </li>
            </ol>
          </GlassCard>
        }
      />
    </Section>
  );
}
