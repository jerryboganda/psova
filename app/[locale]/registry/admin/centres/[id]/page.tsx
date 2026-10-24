import { setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { AdminCentreEditor } from '@/components/registry/AdminCentreEditor';

export const dynamic = 'force-dynamic';

export default async function AdminCentreDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <Section>
      <AdminCentreEditor id={id} />
    </Section>
  );
}
