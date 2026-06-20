import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Microscope, FileText, Network, ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { localized } from '@/lib/utils';

const FOCUS = [
  {
    title: { en: 'Epidemiology in Pakistan', ur: 'پاکستان میں وبائیات' },
    body: {
      en: 'Measuring how common vascular anomalies are across Pakistan to reveal the true scale of need.',
      ur: 'پاکستان بھر میں ویسکولر ایناملیز کتنی عام ہیں اس کی پیمائش تاکہ ضرورت کا حقیقی حجم سامنے آئے۔',
    },
  },
  {
    title: { en: 'Treatment outcomes', ur: 'علاج کے نتائج' },
    body: {
      en: 'Tracking how patients respond to treatments such as propranolol, sclerotherapy, and surgery in local settings.',
      ur: 'مقامی حالات میں مریض پروپرانولول، اسکلیروتھراپی اور سرجری جیسے علاج پر کیسے ردِعمل دیتے ہیں اس کا جائزہ۔',
    },
  },
  {
    title: { en: 'Access & referral', ur: 'رسائی اور ریفرل' },
    body: {
      en: 'Studying the delays and barriers families face in reaching multidisciplinary specialist care.',
      ur: 'خاندانوں کو ماہر کثیر الشعبہ علاج تک پہنچنے میں درپیش تاخیر اور رکاوٹوں کا مطالعہ۔',
    },
  },
];

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Research');
  const tc = await getTranslations('Common');

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#8b3dff" className="group">
            <Microscope className="size-9" style={{ color: '#8b3dff' }} />
            <h2 className="mt-5 text-2xl font-semibold">{t('registryTitle')}</h2>
            <p className="mt-3 text-lg leading-relaxed text-[var(--color-muted)]">
              {t('registryBody')}
            </p>
          </GlassCard>
        </Reveal>
      </Section>

      <Section>
        <SectionHeading title={t('projectsTitle')} />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {FOCUS.map((f) => (
            <StaggerItem key={f.title.en}>
              <div className="h-full rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold">{localized(f.title, locale)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {localized(f.body, locale)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <GlassCard accent="#3d6cff" className="group h-full">
              <FileText className="size-9" style={{ color: '#3d6cff' }} />
              <div className="mt-5 flex items-center gap-3">
                <h3 className="text-xl font-semibold">{t('pubsTitle')}</h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--color-cyan)]">
                  {tc('comingSoon')}
                </span>
              </div>
              <p className="mt-3 leading-relaxed text-[var(--color-muted)]">{t('pubsBody')}</p>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.1}>
            <GlassCard accent="#ff2d9b" className="group flex h-full flex-col">
              <Network className="size-9" style={{ color: '#ff2d9b' }} />
              <h3 className="mt-5 text-xl font-semibold">{t('collabTitle')}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-[var(--color-muted)]">
                {t('collabBody')}
              </p>
              <div className="mt-6">
                <Button href="/contact" variant="glass" size="md">
                  {t('collabTitle')}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
