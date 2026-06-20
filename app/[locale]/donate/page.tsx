import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  HandCoins,
  Heart,
  Baby,
  Repeat,
  MapPin,
  Sparkles,
  ShieldCheck,
  Receipt,
  Landmark,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeading } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientText } from '@/components/ui/GradientText';
import { Accordion } from '@/components/ui/Accordion';
import { PaymentMethods } from '@/components/donate/PaymentMethods';
import { DonateForm } from '@/components/forms/DonateForm';
import { ContactPersonCard } from '@/components/contact/ContactPersonCard';
import { GIVING_TIERS, DESIGNATIONS } from '@/data/donation';
import { SITE, STATS } from '@/data/site';
import { localized } from '@/lib/utils';
import { telHref, whatsappHref } from '@/lib/contact';

const DESIGNATION_ICONS: Record<string, LucideIcon> = {
  'hand-coins': HandCoins,
  heart: Heart,
  baby: Baby,
  repeat: Repeat,
};

const btnBase =
  'group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--color-cyan)]';
const btnPrimary = `${btnBase} bg-brand text-white shadow-[0_10px_40px_-12px_rgba(255,45,155,0.6)] hover:-translate-y-0.5`;
const btnGlass = `${btnBase} glass text-[var(--color-fg)] hover:-translate-y-0.5 hover:bg-white/10`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Donate' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Donate');

  const tel = telHref();
  const wa = whatsappHref(t('waPrefill'));
  const role = localized(SITE.contactPerson.role, locale);

  const why = [
    { Icon: MapPin, title: t('why1Title'), body: t('why1Body') },
    { Icon: Baby, title: t('why2Title'), body: t('why2Body') },
    { Icon: Sparkles, title: t('why3Title'), body: t('why3Body') },
  ];

  const trust = [
    { Icon: ShieldCheck, title: t('trust1Title'), body: t('trust1Body') },
    { Icon: Receipt, title: t('trust2Title'), body: t('trust2Body') },
    { Icon: Landmark, title: t('trust3Title'), body: t('trust3Body') },
  ];

  const faqs = [
    { q: t('faqZakatQ'), a: t('faqZakatA') },
    { q: t('faqWhereQ'), a: t('faqWhereA') },
    { q: t('faqReceiptQ'), a: t('faqReceiptA') },
    { q: t('faqMonthlyQ'), a: t('faqMonthlyA') },
    { q: t('faqIntlQ'), a: t('faqIntlA') },
    { q: t('faqSecureQ'), a: t('faqSecureA') },
    {
      q: t('faqConfirmQ'),
      a: (
        <span>
          {t('faqConfirmA')}{' '}
          <a
            href={tel}
            dir="ltr"
            className="font-medium text-[var(--color-cyan)] hover:underline"
          >
            {SITE.phone}
          </a>{' '}
          (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-cyan)] hover:underline"
          >
            {t('whatsappLabel')}
          </a>
          ).
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        highlight={t('titleHighlight')}
        lead={t('lead')}
      >
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#methods" className={btnPrimary}>
            {t('ctaDonate')}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </a>
          <a href="#contact-block" className={btnGlass}>
            {t('ctaTalk')}
          </a>
        </div>
      </PageHeader>

      {/* Why give */}
      <Section>
        <SectionHeading eyebrow={t('whyEyebrow')} title={t('whyTitle')} lead={t('whyLead')} />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {why.map((w) => (
            <StaggerItem key={w.title}>
              <GlassCard className="h-full">
                <w.Icon className="size-8 text-[var(--color-cyan)]" />
                <h3 className="mt-4 text-lg font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{w.body}</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* The need in numbers */}
      <Section className="py-8">
        <Reveal>
          <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-bold md:text-4xl">
                  <GradientText>{s.value}</GradientText>
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)] md:text-sm">
                  {localized(s.label, locale)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Suggested amounts */}
      <Section>
        <SectionHeading eyebrow={t('tiersEyebrow')} title={t('tiersTitle')} lead={t('tiersLead')} />
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GIVING_TIERS.map((tier) => (
            <StaggerItem key={tier.amount}>
              <GlassCard accent={tier.accent} className="flex h-full flex-col">
                <p className="text-3xl font-bold" style={{ color: tier.accent }}>
                  {tier.display}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
                  {localized(tier.impact, locale)}
                </p>
                <a
                  href="#pledge"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)] hover:text-white"
                >
                  {t('tierGive')}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </a>
              </GlassCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-5">
          <a
            href="#pledge"
            className="block rounded-[var(--radius-2xl)] border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition-colors hover:border-white/30"
          >
            <span className="font-semibold">{t('tierCustom')}</span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">{t('tierCustomNote')}</span>
          </a>
        </Reveal>
      </Section>

      {/* Designations */}
      <Section>
        <SectionHeading
          eyebrow={t('designationsEyebrow')}
          title={t('designationsTitle')}
          lead={t('designationsLead')}
        />
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {DESIGNATIONS.map((d) => {
            const Icon = DESIGNATION_ICONS[d.icon];
            return (
              <StaggerItem key={d.id}>
                <GlassCard accent={d.accent} className="flex h-full flex-col">
                  {Icon && <Icon className="size-9" style={{ color: d.accent }} />}
                  <h3 className="mt-5 text-xl font-semibold">{localized(d.title, locale)}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--color-muted)]">
                    {localized(d.body, locale)}
                  </p>
                  {d.note && (
                    <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-[var(--color-muted)]">
                      {localized(d.note, locale)}
                    </p>
                  )}
                  <a
                    href="#pledge"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)] hover:text-white"
                  >
                    {t('designationGive')}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </a>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      {/* Payment methods */}
      <Section id="methods" className="scroll-mt-28">
        <SectionHeading
          eyebrow={t('methodsEyebrow')}
          title={t('methodsTitle')}
          lead={t('methodsLead')}
        />
        <div className="mt-12">
          <PaymentMethods />
        </div>
        <Reveal className="mt-6">
          <p className="mx-auto max-w-2xl text-center text-sm text-[var(--color-muted)]">
            {t('intlNote')}
          </p>
        </Reveal>
      </Section>

      {/* Trust / transparency */}
      <Section>
        <SectionHeading eyebrow={t('trustEyebrow')} title={t('trustTitle')} lead={t('trustLead')} />
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {trust.map((tr) => (
            <StaggerItem key={tr.title}>
              <GlassCard className="h-full">
                <tr.Icon className="size-8 text-[var(--color-cyan)]" />
                <h3 className="mt-4 text-lg font-semibold">{tr.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{tr.body}</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mx-auto mt-6 max-w-3xl">
          <GlassCard interactive={false}>
            <h3 className="text-lg font-semibold">{t('useOfFundsTitle')}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {[t('useOfFunds1'), t('useOfFunds2'), t('useOfFunds3')].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-cyan)]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-cyan)] hover:underline"
            >
              {t('governanceCta')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </GlassCard>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHeading title={t('faqTitle')} />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion items={faqs} />
        </div>
      </Section>

      {/* Pledge / callback form */}
      <Section id="pledge" className="scroll-mt-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={t('formTitle')} lead={t('formLead')} />
          <Reveal className="mt-10">
            <GlassCard interactive={false}>
              <DonateForm />
            </GlassCard>
          </Reveal>
        </div>
      </Section>

      {/* Donations contact block */}
      <Section id="contact-block" className="scroll-mt-28">
        <Reveal className="mx-auto max-w-3xl">
          <GlassCard accent="#1fe0d4">
            <h2 className="text-2xl font-semibold">{t('contactTitle')}</h2>
            <p className="mt-2 text-[var(--color-muted)]">{t('contactLead')}</p>
            <div className="mt-6">
              <ContactPersonCard
                name={SITE.contactPerson.name}
                role={role}
                phoneDisplay={SITE.phone}
                telHref={tel}
                waHref={wa}
                callLabel={t('callLabel')}
                whatsappLabel={t('whatsappLabel')}
                email={SITE.email}
                emailHref={`mailto:${SITE.email}`}
                emailLabel={t('emailLabel')}
              />
            </div>
          </GlassCard>
        </Reveal>
      </Section>

      {/* Closing CTA */}
      <Section>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 p-10 text-center md:p-16">
            <div className="absolute inset-0 -z-10 animate-gradient bg-[radial-gradient(circle_at_25%_25%,rgba(255,45,155,0.28),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(31,224,212,0.24),transparent_55%),linear-gradient(120deg,rgba(139,61,255,0.18),transparent)]" />
            <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold md:text-5xl">
              <GradientText>{t('finalTitle')}</GradientText>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-muted)]">
              {t('finalBody')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#pledge" className={btnPrimary}>
                <Heart className="size-4" />
                {t('finalPrimary')}
              </a>
              <Link href="/get-involved" className={btnGlass}>
                {t('finalSecondary')}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
