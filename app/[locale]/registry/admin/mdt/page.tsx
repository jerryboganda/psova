import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
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
  // The admin layout has already required an admin session.
  const { items } = await listMdtForAdmin(page);

  return (
    <Section>
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">{t('mdt.title')}</h1>
      <p className="mb-6 max-w-2xl text-[var(--color-muted)]">{t('mdt.lede')}</p>
      <AdminMdt rows={items} />
    </Section>
  );
}
