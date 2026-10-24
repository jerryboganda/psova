import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { AdminCentres } from '@/components/registry/AdminCentres';

export const dynamic = 'force-dynamic';

export default async function AdminCentresPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryAdmin');

  return (
    <Section>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('centres.title')}</h1>
      <AdminCentres initialTab={tab === 'payments' ? 'payments' : 'centres'} />
    </Section>
  );
}
