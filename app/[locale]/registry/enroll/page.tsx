import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { EnrollWizard } from '@/components/registry/EnrollWizard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'RegistryEnroll' });
  return { title: t('title'), description: t('lede') };
}

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryEnroll');

  return (
    <>
      <PageHeader eyebrow="NVAR" title={t('title')} lead={t('lede')} />
      <Section>
        <GlassCard interactive={false} className="mx-auto max-w-3xl">
          <EnrollWizard />
        </GlassCard>
      </Section>
    </>
  );
}
