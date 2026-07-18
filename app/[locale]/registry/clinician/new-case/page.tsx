import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClinicianCaseWizard } from '@/components/registry/ClinicianCaseWizard';

export const dynamic = 'force-dynamic';

export default async function NewCasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryClinician');

  return (
    <Section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">{t('newCaseTitle')}</h1>
        <p className="mt-1 text-[var(--color-muted)]">{t('newCaseLede')}</p>
      </div>
      <GlassCard interactive={false} className="mx-auto max-w-3xl">
        <ClinicianCaseWizard />
      </GlassCard>
    </Section>
  );
}
