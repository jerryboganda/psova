import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { AuthForms } from '@/components/registry/AuthForms';

export default async function RegistryLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryAuth');

  return (
    <>
      <PageHeader eyebrow="NVAR" title={t('title')} lead={t('lede')} />
      <Section>
        <GlassCard interactive={false} className="mx-auto max-w-2xl">
          <AuthForms />
        </GlassCard>
      </Section>
    </>
  );
}
