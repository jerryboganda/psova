import { setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { AdminCentreEditor } from '@/components/registry/AdminCentreEditor';

export const dynamic = 'force-dynamic';

export default async function AdminNewCentrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Section>
      <AdminCentreEditor />
    </Section>
  );
}
