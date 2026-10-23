import { headers } from 'next/headers';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Plus, Search } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { listCentrePatients } from '@/lib/registry/centre-patients';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { clientIpFromHeaders } from '@/lib/registry/guards';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { fieldClass } from '@/components/registry/field';

export const dynamic = 'force-dynamic';

export default async function CentrePatientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q, page: pageParam } = await searchParams;
  const { user, center, state } = await centrePageContext(locale);
  const t = await getTranslations('Centres.patients');
  const tc = await getTranslations('RegistryCommon');
  const format = await getFormatter();

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const result = await listCentrePatients(
    center,
    { q, page },
    { actorId: user.id, ip: clientIpFromHeaders(await headers()) },
  );
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const href = (p: number) => `/centre/patients?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  const conditionName = (slug: string) => {
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug === 'other' ? t('conditionOther') : t('conditionUnknown');
  };

  return (
    <Section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-[var(--color-muted)]">{t('count', { count: result.total })}</p>
        </div>
        {membershipAllowsWrites(state) && (
          <Link href="/centre/patients/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            <Plus className="size-4" />
            {t('add')}
          </Link>
        )}
      </div>

      <form action="" method="get" className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-faint)]" />
          <input
            name="q"
            defaultValue={q ?? ''}
            aria-label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            className={`${fieldClass} ps-11`}
          />
        </div>
        <button type="submit" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10">
          {t('search')}
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">
          {q ? t('noResults') : t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/centre/patients/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/25"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.fullName}</p>
                  <p className="text-xs text-[var(--color-faint)]">
                    <span dir="ltr">{r.phone}</span> · {conditionName(r.conditionSlug)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                  {r.possibleDuplicate && <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-200">{t('duplicate')}</span>}
                  {r.sharedWithNvar && <span className="rounded-full bg-[var(--color-cyan)]/15 px-2.5 py-1 text-[var(--color-cyan)]">{t('sharedNvar')}</span>}
                  <span className="rounded-full bg-white/5 px-2.5 py-1">{tc(`sources.${r.source}`)}</span>
                  {r.mrn && <span dir="ltr" className="font-mono">{r.mrn}</span>}
                  <span dir="ltr" className="font-mono">{r.trackingCode}</span>
                  <span>{format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label={t('pagination')}>
          {page > 1 ? <Link href={href(page - 1)} className="text-[var(--color-cyan)] hover:underline">{tc('back')}</Link> : <span />}
          <span className="text-[var(--color-muted)]">{tc('page')} {page} {tc('of')} {totalPages}</span>
          {page < totalPages ? <Link href={href(page + 1)} className="text-[var(--color-cyan)] hover:underline">{tc('next')}</Link> : <span />}
        </nav>
      )}
    </Section>
  );
}
