import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { MdtPostForm, type MdtDocOption, type MdtPrefill } from '@/components/centres/MdtPostForm';
import { centrePageContext } from '@/lib/registry/centre-page';
import { ageBandKey } from '@/lib/registry/constants';
import { membershipAllowsWrites } from '@/lib/registry/membership';
import { prisma } from '@/lib/registry/db';

export const dynamic = 'force-dynamic';

export default async function NewMdtPostPage({
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
  const t = await getTranslations('Centres.mdt');

  // Opened from a patient's page: prefill the de-identified attributes and offer that patient's
  // teaching-consented files. Nothing here is stored against the patient.
  let prefill: MdtPrefill = {};
  let documents: MdtDocOption[] = [];
  if (patient) {
    const p = await prisma.registryPatient.findFirst({
      where: { id: patient, centerId: center.id },
      select: {
        gender: true,
        birthYear: true,
        province: true,
        diagnoses: { take: 1, orderBy: { createdAt: 'asc' }, select: { conditionSlug: true, bodySite: true } },
        documents: { where: { consentForTeaching: true }, select: { id: true, kind: true, size: true } },
      },
    });
    if (p) {
      prefill = {
        gender: p.gender,
        ageBand: ageBandKey(Math.max(0, new Date().getFullYear() - p.birthYear)),
        province: p.province,
        conditionSlug: p.diagnoses[0]?.conditionSlug,
        bodySite: p.diagnoses[0]?.bodySite,
      };
      documents = p.documents;
    }
  }

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('newPost')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('newLede')}</p>
      <GlassCard interactive={false} className="max-w-3xl">
        {membershipAllowsWrites(state) ? (
          <MdtPostForm prefill={prefill} documents={documents} />
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
