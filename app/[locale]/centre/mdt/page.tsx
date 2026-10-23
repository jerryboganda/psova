import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { MessagesSquare, Plus } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { TierBadge } from '@/components/centres/TierBadge';
import { listMdtPosts } from '@/lib/registry/centre-mdt';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CentreMdtPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = statusParam === 'OPEN' || statusParam === 'RESOLVED' ? statusParam : undefined;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const { state } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const t = await getTranslations('Centres.mdt');
  const tc = await getTranslations('RegistryCommon');
  const format = await getFormatter();
  const { items, total, pageSize } = await listMdtPosts({ status, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => `/centre/mdt?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <Section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-[var(--color-muted)]">{t('lede')}</p>
        </div>
        {membershipAllowsWrites(state) && (
          <Link href="/centre/mdt/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            <Plus className="size-4" />
            {t('newPost')}
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {([undefined, 'OPEN', 'RESOLVED'] as const).map((s) => (
          <Link
            key={s ?? 'all'}
            href={`/centre/mdt${s ? `?status=${s}` : ''}`}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              status === s ? 'bg-brand text-white' : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            {t(`filter.${s ?? 'ALL'}`)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => {
            const condition = CONDITIONS.find((c) => c.slug === p.conditionSlug);
            return (
              <li key={p.id}>
                <Link href={`/centre/mdt/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/25">
                  <div className="min-w-0">
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-faint)]">
                      <span>{p.centre.name} · {p.centre.city}</span>
                      <TierBadge tier={p.centre.tier as 'MEMBER' | 'ACCREDITED' | 'EXCELLENCE'} />
                      {condition && <span>{localized(condition.name, locale)}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1"><MessagesSquare className="size-3.5" />{p.comments}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1">{t(`status.${p.status}`)}</span>
                    <span>{format.dateTime(new Date(p.createdAt), { dateStyle: 'medium' })}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="text-[var(--color-cyan)] hover:underline">{tc('back')}</Link> : <span />}
          <span className="text-[var(--color-muted)]">{tc('page')} {page} {tc('of')} {totalPages}</span>
          {page < totalPages ? <Link href={href(page + 1)} className="text-[var(--color-cyan)] hover:underline">{tc('next')}</Link> : <span />}
        </nav>
      )}
    </Section>
  );
}
