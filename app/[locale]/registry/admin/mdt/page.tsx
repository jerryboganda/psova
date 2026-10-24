import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { AdminMdt } from '@/components/registry/AdminMdt';
import { listMdtForAdmin } from '@/lib/registry/centre-mdt';

export const dynamic = 'force-dynamic';

export default async function AdminMdtPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const t = await getTranslations('RegistryAdmin');
  const tc = await getTranslations('RegistryCommon');
  // The admin layout has already required an admin session.
  const { items, total, pageSize } = await listMdtForAdmin(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Section>
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">{t('mdt.title')}</h1>
      <p className="mb-6 max-w-2xl text-[var(--color-muted)]">{t('mdt.lede')}</p>
      <AdminMdt rows={items} />
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <span className="text-[var(--color-faint)]">
            {tc('page')} {page} {tc('of')} {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/registry/admin/mdt?page=${page - 1}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium">
                {tc('back')}
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/registry/admin/mdt?page=${page + 1}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium">
                {tc('next')}
              </Link>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
