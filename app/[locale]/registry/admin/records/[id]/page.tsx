import { setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { AdminRecordDetail } from '@/components/registry/AdminRecordDetail';

export const dynamic = 'force-dynamic';

export default async function AdminRecordDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <AdminRecordDetail id={id} />
    </Section>
  );
}
