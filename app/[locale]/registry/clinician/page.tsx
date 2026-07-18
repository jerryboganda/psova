import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { MyCasesTable } from '@/components/registry/MyCasesTable';

export const dynamic = 'force-dynamic';

export default async function ClinicianCasesPage({
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
        <h1 className="text-2xl font-bold md:text-3xl">{t('casesTitle')}</h1>
        <p className="mt-1 text-[var(--color-muted)]">{t('casesLede')}</p>
      </div>
      <MyCasesTable />
    </Section>
  );
}
