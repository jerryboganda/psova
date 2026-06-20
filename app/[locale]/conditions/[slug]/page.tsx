import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Stethoscope, Pill, CalendarClock, Activity, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { ConditionCard } from '@/components/conditions/ConditionCard';
import { CONDITIONS, getCondition } from '@/data/conditions';
import { localized } from '@/lib/utils';

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CONDITIONS.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getCondition(slug);
  if (!c) return {};
  return { title: localized(c.name, locale), description: localized(c.summary, locale) };
}

export default async function ConditionDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = getCondition(slug);
  if (!c) notFound();

  const t = await getTranslations('Conditions');
  const tDis = await getTranslations('Disclaimer');
  const related = CONDITIONS.filter((x) => x.category === c.category && x.slug !== c.slug).slice(0, 3);

  const facts = [
    { Icon: CalendarClock, label: t('ageTitle'), value: localized(c.ageOnset, locale) },
    { Icon: Activity, label: t('prevalenceTitle'), value: localized(c.prevalence, locale) },
  ];
  const blocks = [
    { Icon: Stethoscope, title: t('diagnosisTitle'), body: localized(c.diagnosis, locale) },
    { Icon: Pill, title: t('treatmentTitle'), body: localized(c.treatment, locale) },
    { Icon: AlertCircle, title: t('whenTitle'), body: localized(c.whenToSeeDoctor, locale) },
  ];

  return (
    <>
      <header className="relative overflow-hidden px-5 pb-8 pt-32 md:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(60% 60% at 30% 0%, color-mix(in srgb, ${c.accent} 30%, transparent), transparent 65%)`,
          }}
        />
        <div className="mx-auto max-w-4xl">
          <Link
            href="/conditions"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('backToAll')}
          </Link>
          <span
            className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ color: c.accent, background: `color-mix(in srgb, ${c.accent} 14%, transparent)` }}
          >
            <span className="size-1.5 rounded-full" style={{ background: c.accent }} />
            {c.category === 'tumor' ? t('categoryTumor') : t('categoryMalformation')}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold md:text-6xl">
            {localized(c.name, locale)}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            {localized(c.tagline, locale)}
          </p>
        </div>
      </header>

      <Section>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-white/5 text-[var(--color-cyan)]">
                  <f.Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--color-faint)]">{f.label}</p>
                  <p className="font-medium">{f.value}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-lg leading-relaxed text-[var(--color-muted)]">
            {localized(c.summary, locale)}
          </p>

          <div className="mt-8 rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <h2 className="text-lg font-semibold">{t('signsTitle')}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.signs.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--color-muted)]">
                  <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full" style={{ background: c.accent }} />
                  {localized(s, locale)}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid gap-6">
            {blocks.map((b) => (
              <Reveal key={b.title}>
                <div className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-[var(--color-cyan)]">
                      <b.Icon className="size-5" />
                    </div>
                    <h2 className="text-xl font-semibold">{b.title}</h2>
                  </div>
                  <p className="mt-4 leading-relaxed text-[var(--color-muted)]">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs leading-relaxed text-amber-100/80">
            {tDis('short')}
          </p>
        </div>
      </Section>

      {related.length > 0 && (
        <Section>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-semibold">{t('relatedTitle')}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
              <ConditionCard
                key={r.slug}
                condition={r}
                locale={locale}
                categoryLabel={r.category === 'tumor' ? t('categoryTumor') : t('categoryMalformation')}
              />
            ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
