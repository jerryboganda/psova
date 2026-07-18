import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { AdminRecordsBrowser } from '@/components/registry/AdminRecordsBrowser';

export const dynamic = 'force-dynamic';

export default async function AdminQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryAdmin');

  return (
    <Section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">{t('queue.title')}</h1>
        <p className="mt-1 text-[var(--color-muted)]">{t('queue.lede')}</p>
      </div>
      <AdminRecordsBrowser queue />
    </Section>
  );
}
