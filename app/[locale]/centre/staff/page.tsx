import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { CentreStaff } from '@/components/centres/CentreStaff';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';

export const dynamic = 'force-dynamic';

export default async function CentreStaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { state } = await centrePageContext(locale, ['OWNER']);
  const t = await getTranslations('Centres.staff');

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('lede')}</p>
      <CentreStaff readOnly={!membershipAllowsWrites(state)} />
    </Section>
  );
}
