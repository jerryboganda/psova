import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link } from '@/i18n/navigation';
import { ClinicianCaseWizard } from '@/components/registry/ClinicianCaseWizard';
import { centrePageContext } from '@/lib/registry/centre-page';
import { membershipAllowsWrites } from '@/lib/registry/membership';

export const dynamic = 'force-dynamic';

export default async function NewCentrePatientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center, state } = await centrePageContext(locale);
  const t = await getTranslations('Centres.patients');

  return (
    <Section>
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">{t('newTitle')}</h1>
      <p className="mb-8 text-[var(--color-muted)]">{t('newLede')}</p>
      <GlassCard interactive={false} className="max-w-3xl">
        {membershipAllowsWrites(state) ? (
          <ClinicianCaseWizard
            endpoint="/api/centre/patients"
            showMrn
            showConsent
            openHrefBase="/centre/patients"
            // The patient's own province/district, preset to the centre's as a convenience.
            defaults={{ province: center.province, district: center.city }}
          />
        ) : (
          <div className="text-center">
            <p className="mb-4 text-[var(--color-muted)]">{t('readOnly')}</p>
            <Link href="/centre/membership" className="text-sm text-[var(--color-cyan)] hover:underline">
              {t('renew')}
            </Link>
          </div>
        )}
      </GlassCard>
    </Section>
  );
}
