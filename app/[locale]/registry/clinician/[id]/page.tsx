import { setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { CaseDetailClient } from '@/components/registry/CaseDetailClient';

export const dynamic = 'force-dynamic';

export default async function ClinicianCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <CaseDetailClient id={id} backHref="/registry/clinician" />
    </Section>
  );
}
