import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { CentreProfileForm } from '@/components/centres/CentreProfileForm';
import { centrePageContext } from '@/lib/registry/centre-page';
import { jsonStringArray } from '@/lib/registry/json';
import type { CenterProfileInput } from '@/lib/registry/schemas';

export const dynamic = 'force-dynamic';

export default async function CentreProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center } = await centrePageContext(locale, ['OWNER']);
  const t = await getTranslations('Centres.profileEdit');

  const initial: CenterProfileInput = {
    nameUr: center.nameUr ?? '',
    address: center.address,
    phone: center.phone,
    contactEmail: center.email,
    websiteUrl: center.website ?? '',
    services: jsonStringArray(center.services) as CenterProfileInput['services'],
    conditions: jsonStringArray(center.conditions),
  };

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('lede')}</p>
      <GlassCard interactive={false} className="max-w-3xl">
        <CentreProfileForm initial={initial} />
      </GlassCard>
    </Section>
  );
}
