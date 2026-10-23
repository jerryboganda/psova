import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { CaseAttributes } from '@/components/centres/CaseAttributes';
import { ShareRespondForm } from '@/components/centres/ShareRespondForm';
import { listShares } from '@/lib/registry/centre-sharing';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CentreSharesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ dir?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { dir } = await searchParams;
  const direction = dir === 'outgoing' ? 'outgoing' : 'incoming';
  const { center, state } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const t = await getTranslations('Centres.sharing');
  const td = await getTranslations('Centres.documents');
  const format = await getFormatter();
  const rows = await listShares(center, direction);
  const canWrite = membershipAllowsWrites(state);

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('pageTitle')}</h1>
      <p className="mb-6 text-[var(--color-muted)]">{t('pageLede')}</p>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {(['incoming', 'outgoing'] as const).map((d) => (
          <Link
            key={d}
            href={`/centre/shares?dir=${d}`}
            role="tab"
            aria-selected={direction === d}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              direction === d ? 'bg-brand text-white' : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            {t(`dir.${d}`)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t(`empty.${direction}`)}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {t(`types.${r.type}`)} · {r.centre.name} <span className="font-normal text-[var(--color-muted)]">({r.centre.city})</span>
                  </p>
                  <p className="text-xs text-[var(--color-faint)]">
                    {format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold">{t(`status.${r.status}`)}</span>
              </div>

              {r.summary && direction === 'incoming' && (
                <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">{t('deidentified')}</p>
                  <CaseAttributes {...r.summary} />
                </div>
              )}

              {r.note && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--color-faint)]">{direction === 'incoming' ? t('senderNote') : t('yourNote')}</p>
                  <p className="whitespace-pre-wrap text-sm">{r.note}</p>
                </div>
              )}

              {r.documents.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {r.documents.map((d, i) => (
                    <li key={d.id}>
                      <a
                        href={`/api/centre/shares/${r.id}/documents/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                      >
                        {td(`kinds.${d.kind}`)} {i + 1} · {d.mime.startsWith('image/') ? td('open') : td('download')}
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {r.response && (
                <div className="mb-3 rounded-xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 p-4">
                  <p className="text-xs text-[var(--color-faint)]">{r.status === 'DECLINED' ? t('declineReasonShown') : t('opinion')}</p>
                  <p className="whitespace-pre-wrap text-sm">{r.response}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {direction === 'incoming' && r.status === 'ACCEPTED' && r.patientId && (
                  <Link href={`/centre/patients/${r.patientId}`} className="text-sm text-[var(--color-cyan)] hover:underline">{t('openCopy')}</Link>
                )}
                {direction === 'outgoing' && r.patientId && (
                  <Link href={`/centre/patients/${r.patientId}`} className="text-sm text-[var(--color-cyan)] hover:underline">{t('openPatient')}</Link>
                )}
              </div>

              {direction === 'incoming' && r.status === 'SENT' && (
                <div className="mt-3 border-t border-white/10 pt-4">
                  {canWrite ? (
                    <ShareRespondForm shareId={r.id} type={r.type as 'REFERRAL' | 'SECOND_OPINION'} />
                  ) : (
                    <p className="text-sm text-[var(--color-muted)]">{t('readOnly')}</p>
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
