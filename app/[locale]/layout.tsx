import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MotionConfig } from 'framer-motion';
import { routing, getDirection } from '@/i18n/routing';
import { fontVariables } from '@/lib/fonts';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgressBar } from '@/components/layout/ScrollProgressBar';
import '../globals.css';

type Params = Promise<{ locale: string }>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    metadataBase: new URL('https://psova.polytronx.com'),
    title: { default: t('titleDefault'), template: t('titleTemplate') },
    description: t('description'),
    openGraph: {
      title: t('titleDefault'),
      description: t('description'),
      type: 'website',
      locale,
    },
    icons: { icon: '/favicon.svg' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Nav' });
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <MotionConfig reducedMotion="user">
            <SmoothScroll>
              <ScrollProgressBar />
              <Header />
              <main id="main">{children}</main>
              <Footer />
            </SmoothScroll>
          </MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
