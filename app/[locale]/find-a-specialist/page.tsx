import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { DirectoryExplorer } from '@/components/directory/DirectoryExplorer';
import { Link } from '@/i18n/navigation';
import { getRegisteredCareCenters } from '@/lib/registry/directory';

// Registered centres come from the database and change as centres join or lapse.
export const dynamic = 'force-dynamic';

export default async function FindSpecialistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Directory');
  const registered = await getRegisteredCareCenters();

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <Section>
        <div className="mx-auto mb-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm leading-relaxed text-amber-100/80">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t('verifyNotice')}
        </div>
        <DirectoryExplorer registered={registered} />
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-lg font-semibold">{t('joinTitle')}</h2>
          <p className="text-sm text-[var(--color-muted)]">{t('joinBody')}</p>
          <Link href="/centres/apply" className="inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
            {t('joinCta')}
          </Link>
        </div>
      </Section>
    </>
  );
}
