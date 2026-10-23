import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { SupportRequestForm } from '@/components/centres/SupportRequestForm';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { prisma } from '@/lib/registry/db';

export const dynamic = 'force-dynamic';

export default async function NewSupportRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ patient?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { patient } = await searchParams;
  const { center, state } = await centrePageContext(locale, ['OWNER', 'DOCTOR']);
  const t = await getTranslations('Centres.support');
  if (!patient) notFound();

  const own = await prisma.registryPatient.findFirst({
    where: { id: patient, centerId: center.id },
    select: { id: true, trackingCode: true },
  });
  if (!own) notFound();

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('newTitle')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">
        {t('newLede')} <span dir="ltr" className="font-mono">{own.trackingCode}</span>
      </p>
      <GlassCard interactive={false} className="max-w-3xl">
        {membershipAllowsWrites(state) ? (
          <SupportRequestForm patientId={own.id} />
        ) : (
          <p className="text-center text-[var(--color-muted)]">
            {t('readOnly')}{' '}
            <Link href="/centre/membership" className="text-[var(--color-cyan)] hover:underline">{t('renew')}</Link>
          </p>
        )}
      </GlassCard>
    </Section>
  );
}
