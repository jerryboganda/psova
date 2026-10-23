import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/centres/TierBadge';
import { Link } from '@/i18n/navigation';
import { CONDITIONS } from '@/data/conditions';
import { getListedCenterBySlug, toCareCenter } from '@/lib/registry/directory';
import { localized } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CentreProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const row = await getListedCenterBySlug(slug);
  if (!row) notFound();

  const t = await getTranslations('Centres.profile');
  const td = await getTranslations('Directory');
  const format = await getFormatter();
  const center = toCareCenter(row);
  const conditions = CONDITIONS.filter((c) => center.conditions.includes(c.slug));
  const typeKey = { public: 'typePublic', private: 'typePrivate', trust: 'typeTrust' } as const;

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={localized(center.name, locale)}
        lead={`${localized(center.city, locale)} · ${localized(center.province, locale)}`}
      />
      <Section>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            <GlassCard interactive={false}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <TierBadge tier={row.tier} />
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[var(--color-faint)]">
                  {td(typeKey[center.type])}
                </span>
              </div>
              <h2 className="mb-3 text-lg font-semibold">{t('services')}</h2>
              <div className="flex flex-wrap gap-2">
                {center.services.map((s) => (
                  <span key={s.en} className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-[var(--color-muted)]">
                    {localized(s, locale)}
                  </span>
                ))}
              </div>
            </GlassCard>

            <GlassCard interactive={false}>
              <h2 className="mb-3 text-lg font-semibold">{t('conditions')}</h2>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/conditions/${c.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
                  >
                    {localized(c.name, locale)}
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>

          <aside className="flex flex-col gap-6">
            <GlassCard interactive={false}>
              <h2 className="mb-4 text-lg font-semibold">{t('contact')}</h2>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--color-cyan)]" />
                  <span>{row.address}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-[var(--color-cyan)]" />
                  <a href={`tel:${row.phone}`} dir="ltr" className="hover:underline">{row.phone}</a>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-[var(--color-cyan)]" />
                  <a href={`mailto:${row.email}`} dir="ltr" className="break-all hover:underline">{row.email}</a>
                </li>
                {row.website && (
                  <li className="flex gap-3">
                    <ExternalLink className="mt-0.5 size-4 shrink-0 text-[var(--color-cyan)]" />
                    <a href={row.website} target="_blank" rel="noreferrer" dir="ltr" className="break-all hover:underline">{row.website}</a>
                  </li>
                )}
              </ul>
            </GlassCard>

            <GlassCard interactive={false}>
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5 text-[var(--color-cyan)]" />
                {t('registered')}
              </div>
              {row.approvedAt && (
                <p className="text-sm text-[var(--color-muted)]">
                  {t('since', { date: format.dateTime(row.approvedAt, { dateStyle: 'medium' }) })}
                </p>
              )}
              <Link href={`/centres/verify/${row.slug}`} className="mt-3 inline-block text-sm text-[var(--color-cyan)] hover:underline">
                {t('verifyLink')}
              </Link>
            </GlassCard>
          </aside>
        </div>
      </Section>
    </>
  );
}
