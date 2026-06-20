import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { DirectoryExplorer } from '@/components/directory/DirectoryExplorer';

export default async function FindSpecialistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Directory');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <Section>
        <div className="mx-auto mb-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm leading-relaxed text-amber-100/80">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t('verifyNotice')}
        </div>
        <DirectoryExplorer />
      </Section>
    </>
  );
}
