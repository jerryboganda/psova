import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { ContactForm } from '@/components/forms/ContactForm';
import { ContactPersonCard } from '@/components/contact/ContactPersonCard';
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  LinkedinIcon,
  XIcon,
} from '@/components/icons/Social';
import { SITE } from '@/data/site';
import { localized } from '@/lib/utils';
import { telHref, whatsappHref } from '@/lib/contact';

const SOCIALS = [
  { key: 'facebook', Icon: FacebookIcon },
  { key: 'instagram', Icon: InstagramIcon },
  { key: 'youtube', Icon: YoutubeIcon },
  { key: 'linkedin', Icon: LinkedinIcon },
  { key: 'x', Icon: XIcon },
] as const;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');

  const details = [
    { Icon: Mail, label: t('emailLabel'), value: SITE.email, href: `mailto:${SITE.email}` },
    { Icon: Phone, label: t('phoneLabel'), value: SITE.phone, href: telHref() },
    { Icon: MapPin, label: t('addressLabel'), value: localized(SITE.address, locale) },
  ];

  return (
    <>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} lead={t('lead')} />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <GlassCard interactive={false}>
            <ContactForm />
          </GlassCard>

          <div className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-faint)]">
                {t('personTitle')}
              </p>
              <ContactPersonCard
                name={SITE.contactPerson.name}
                role={localized(SITE.contactPerson.role, locale)}
                phoneDisplay={SITE.phone}
                telHref={telHref()}
                waHref={whatsappHref()}
                callLabel={t('callLabel')}
                whatsappLabel={t('whatsappLabel')}
              />
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t('reachTitle')}</h2>
              {details.map((d) => (
                <div key={d.label} className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-[var(--color-cyan)]">
                    <d.Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--color-faint)]">
                      {d.label}
                    </p>
                    {d.href ? (
                      <a href={d.href} className="text-[var(--color-fg)] hover:text-white">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-[var(--color-fg)]">{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-faint)]">
                {t('followTitle')}
              </h3>
              <div className="flex gap-2">
                {SOCIALS.map(({ key, Icon }) => (
                  <a
                    key={key}
                    href={SITE.social[key as keyof typeof SITE.social]}
                    aria-label={key}
                    className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--color-muted)] transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
