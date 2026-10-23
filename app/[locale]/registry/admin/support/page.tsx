import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Link } from '@/i18n/navigation';
import { AdminSupport } from '@/components/registry/AdminSupport';
import { SUPPORT_STATUSES } from '@/lib/registry/constants';
import { listAdminSupport } from '@/lib/registry/support-fund';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = SUPPORT_STATUSES.find((s) => s === statusParam) ?? 'SUBMITTED';
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const t = await getTranslations('RegistryAdmin');
  // The admin layout has already required an admin session.
  const { items } = await listAdminSupport({ status, page });

  return (
    <Section>
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">{t('support.title')}</h1>
      <p className="mb-6 max-w-2xl text-[var(--color-muted)]">{t('support.lede')}</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {SUPPORT_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/registry/admin/support?status=${s}`}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              status === s ? 'bg-brand text-white' : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            {t(`support.status.${s}`)}
          </Link>
        ))}
      </div>
      <AdminSupport rows={items} />
    </Section>
  );
}
