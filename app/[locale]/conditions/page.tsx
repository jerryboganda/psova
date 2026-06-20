import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConditionsBrowser } from '@/components/conditions/ConditionsBrowser';
import { AnatomyExplorer } from '@/components/conditions/AnatomyExplorer';

export default async function ConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Conditions');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <ConditionsBrowser />
      </Section>

      <Section>
        <SectionHeading title={t('explorerTitle')} lead={t('explorerLead')} />
        <div className="mt-12">
          <AnatomyExplorer />
        </div>
      </Section>
    </>
  );
}
