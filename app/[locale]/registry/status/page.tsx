import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { StatusLookup } from '@/components/registry/StatusLookup';

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryStatus');

  return (
    <>
      <PageHeader eyebrow="NVAR" title={t('title')} lead={t('lede')} />
      <Section>
        <StatusLookup />
      </Section>
    </>
  );
}
