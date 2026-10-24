import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { ResetPasswordForm } from '@/components/registry/ResetPasswordForm';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, error } = await searchParams;
  const t = await getTranslations('RegistryAuth.reset');

  return (
    <>
      <PageHeader eyebrow="PSOVA" title={t('title')} lead={t('lede')} />
      <Section>
        <GlassCard interactive={false} className="mx-auto max-w-md">
          <ResetPasswordForm token={token} tokenError={Boolean(error)} />
        </GlassCard>
      </Section>
    </>
  );
}
