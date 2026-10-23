import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/centres/TierBadge';
import { PrintButton } from '@/components/centres/PrintButton';
import { requireCenterMember } from '@/lib/registry/guards';
import { isPubliclyListed } from '@/lib/registry/membership';
import { localized } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CentreCertificatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres.certificate');
  const format = await getFormatter();

  const { center, state } = await requireCenterMember(await headers());

  if (!isPubliclyListed(center.status, state)) {
    return (
      <Section>
        <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
          <h1 className="mb-3 text-xl font-bold">{t('unavailableTitle')}</h1>
          <p className="text-[var(--color-muted)]">{t('unavailableBody')}</p>
        </GlassCard>
      </Section>
    );
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psova.org.pk').replace(/\/$/, '');
  const verifyUrl = `${site}/${locale}/centres/verify/${center.slug}`;
  // Black on white so it prints and scans reliably on paper.
  const qr = await QRCode.toString(verifyUrl, { type: 'svg', margin: 1, width: 160 });

  return (
    <Section>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <div className="w-full rounded-[var(--radius-2xl)] border-4 border-double border-[var(--color-cyan)]/50 bg-white p-10 text-center text-slate-900 print:border-slate-400">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t('society')}</p>
          <h1 className="mt-4 text-3xl font-bold">{t('title')}</h1>
          <p className="mt-8 text-slate-500">{t('certifies')}</p>
          <p className="mt-2 text-3xl font-bold">
            {localized({ en: center.nameEn, ur: center.nameUr || center.nameEn }, locale)}
          </p>
          <p className="mt-1 text-slate-500">{center.city}</p>
          <div className="mt-6 flex justify-center">
            <TierBadge tier={center.tier} />
          </div>
          <p className="mx-auto mt-6 max-w-lg text-sm text-slate-600">{t('body')}</p>
          {center.membershipExpiresAt && (
            <p className="mt-6 font-medium">
              {t('validUntil', { date: format.dateTime(center.membershipExpiresAt, { dateStyle: 'long' }) })}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="size-40 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="text-xs text-slate-500">{t('scan')}</p>
            <p dir="ltr" className="break-all text-[10px] text-slate-400">{verifyUrl}</p>
          </div>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>
    </Section>
  );
}
