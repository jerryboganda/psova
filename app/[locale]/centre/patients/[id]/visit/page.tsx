import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { VisitForm } from '@/components/centres/VisitForm';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { prisma } from '@/lib/registry/db';

export const dynamic = 'force-dynamic';

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  // Reception does not record visits; they are sent back to the dashboard home.
  const { center, member, state } = await centrePageContext(locale, ['OWNER', 'DOCTOR', 'NURSE']);
  const t = await getTranslations('Centres.visit');
  const tp = await getTranslations('Centres.patients');

  const own = await prisma.registryPatient.findFirst({ where: { id, centerId: center.id }, select: { id: true } });
  if (!own) notFound();

  return (
    <Section>
      <Link href={`/centre/patients/${id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {tp('backToPatient')}
      </Link>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('title')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('lede')}</p>
      <GlassCard interactive={false} className="max-w-3xl">
        {membershipAllowsWrites(state) ? (
          <VisitForm patientId={id} canPlan={member.role !== 'NURSE'} />
        ) : (
          <p className="text-center text-[var(--color-muted)]">{tp('readOnly')}</p>
        )}
      </GlassCard>
    </Section>
  );
}
