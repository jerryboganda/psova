import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { centrePageContext } from '@/lib/registry/centre-page';
import { listCentreSupport } from '@/lib/registry/support-fund';

export const dynamic = 'force-dynamic';

export default async function CentreSupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const t = await getTranslations('Centres.support');
  const td = await getTranslations('RegistryAdmin.support');
  const format = await getFormatter();
  const rows = await listCentreSupport(center);
  const pkr = (n: number) => `PKR ${n.toLocaleString('en-US')}`;

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-8 max-w-2xl text-[var(--color-muted)]">{t('lede')}</p>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.treatment}</p>
                  <p className="text-xs text-[var(--color-faint)]">
                    <span dir="ltr" className="font-mono">{r.publicCode}</span> · {format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="text-end text-sm">
                  <p dir="ltr" className="font-semibold">{pkr(r.fundedPkr)} / {pkr(r.estimatedCostPkr)}</p>
                  <p className="text-xs text-[var(--color-muted)]">{td(`status.${r.status}`)}</p>
                </div>
              </div>
              {r.statusReason && <p className="mt-2 text-xs text-[var(--color-rose)]">{r.statusReason}</p>}
              <Link href={`/centre/patients/${r.patientId}`} className="mt-3 inline-block text-sm text-[var(--color-cyan)] hover:underline">
                {t('openPatient')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
