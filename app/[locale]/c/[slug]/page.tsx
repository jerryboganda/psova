import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { EnrollWizard } from '@/components/registry/EnrollWizard';
import { prisma } from '@/lib/registry/db';
import { getListedCenterBySlug } from '@/lib/registry/directory';
import { localized } from '@/lib/utils';

// Patient registration for one centre — reached from the QR code, never indexed.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CentreIntakePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres.intake');

  const center = await getListedCenterBySlug(slug);
  if (!center) {
    // Known centre that is not live (e.g. membership lapsed): say so instead of a bare 404.
    const known = await prisma.center.findUnique({ where: { slug }, select: { id: true } }).catch(() => null);
    if (!known) notFound();
    return (
      <Section className="pt-28 md:pt-32">
        <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
          <h1 className="mb-3 text-2xl font-bold">{t('closedTitle')}</h1>
          <p className="text-[var(--color-muted)]">{t('closedBody')}</p>
        </GlassCard>
      </Section>
    );
  }

  const name = localized({ en: center.nameEn, ur: center.nameUr || center.nameEn }, locale);

  return (
    <>
      <PageHeader eyebrow={name} title={t('title')} lead={t('lede')} />
      <Section>
        <GlassCard interactive={false} className="mx-auto max-w-3xl">
          <EnrollWizard centre={{ slug: center.slug, name, province: center.province, city: center.city }} />
        </GlassCard>
      </Section>
    </>
  );
}
