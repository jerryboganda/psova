import QRCode from 'qrcode';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { TierBadge } from '@/components/centres/TierBadge';
import { PrintButton } from '@/components/centres/PrintButton';
import { centrePageContext } from '@/lib/registry/centre-page';

export const dynamic = 'force-dynamic';

export default async function CentrePosterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { center } = await centrePageContext(locale);
  const t = await getTranslations('Centres.poster');
  // Printed in both languages regardless of the viewer's locale.
  const en = await getTranslations({ locale: 'en', namespace: 'Centres.poster' });
  const ur = await getTranslations({ locale: 'ur', namespace: 'Centres.poster' });

  // Locale-less on purpose: the middleware sends the scanner to their own language.
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psova.org.pk').replace(/\/$/, '');
  const link = `${site}/c/${center.slug}`;
  const qr = await QRCode.toString(link, { type: 'svg', margin: 1, width: 280 });

  return (
    <Section>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <div className="w-full rounded-[var(--radius-2xl)] bg-white p-10 text-center text-slate-900 print:rounded-none">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">PSOVA</p>
          <h1 className="mt-3 text-3xl font-bold">{center.nameEn}</h1>
          {center.nameUr && <p dir="rtl" className="mt-1 text-2xl">{center.nameUr}</p>}
          <div className="mt-3 flex justify-center">
            <TierBadge tier={center.tier} />
          </div>
          <div className="mx-auto mt-8 size-72 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="mt-6 text-2xl font-bold">{en('scan')}</p>
          <p dir="rtl" className="mt-1 text-2xl font-bold">{ur('scan')}</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">{en('body')}</p>
          <p dir="rtl" className="mx-auto mt-2 max-w-md text-sm text-slate-600">{ur('body')}</p>
          <p dir="ltr" className="mt-6 break-all text-xs text-slate-400">{link}</p>
        </div>
        <p className="text-center text-sm text-[var(--color-muted)] print:hidden">{t('note')}</p>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>
    </Section>
  );
}
