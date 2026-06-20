import { useLocale, useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  LinkedinIcon,
  XIcon,
  WhatsappIcon,
} from '@/components/icons/Social';
import { Link } from '@/i18n/navigation';
import { FOOTER_LINKS, NAV_CTA } from '@/data/navigation';
import { SITE } from '@/data/site';
import { localized } from '@/lib/utils';
import { telHref, whatsappHref } from '@/lib/contact';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';

const SOCIALS = [
  { key: 'facebook', Icon: FacebookIcon },
  { key: 'instagram', Icon: InstagramIcon },
  { key: 'youtube', Icon: YoutubeIcon },
  { key: 'linkedin', Icon: LinkedinIcon },
  { key: 'x', Icon: XIcon },
] as const;

export function Footer() {
  const t = useTranslations('Footer');
  const tNav = useTranslations('Nav');
  const tDis = useTranslations('Disclaimer');
  const locale = useLocale();
  const year = 2026;

  return (
    <footer className="relative mt-10 border-t border-white/10 px-5 pb-10 pt-16">
      <div className="mx-auto grid w-full max-w-7xl gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
            {localized(SITE.fullName, locale)} — {t('tagline')}
          </p>

          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)]">
              {t('contactPersonLabel')}
            </p>
            <p className="text-sm font-medium text-[var(--color-fg)]">
              {SITE.contactPerson.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted)]">
              <a href={telHref()} className="inline-flex items-center gap-1.5 hover:text-white">
                <Phone className="size-4" />
                <span dir="ltr">{SITE.phone}</span>
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <WhatsappIcon className="size-4 text-[#25D366]" />
                {t('whatsappLabel')}
              </a>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            {SOCIALS.map(({ key, Icon }) => (
              <a
                key={key}
                href={SITE.social[key as keyof typeof SITE.social]}
                aria-label={key}
                className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--color-muted)] transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.titleKey} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-faint)]">
              {t(col.titleKey)}
            </h3>
            {col.links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className="text-sm text-[var(--color-muted)] transition-colors hover:text-white"
              >
                {tNav(l.key)}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 w-full max-w-7xl rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="text-xl font-semibold">{t('newsletter')}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t('newsletterLead')}</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-7xl">
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs leading-relaxed text-amber-100/80">
          {tDis('short')}
        </p>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-[var(--color-faint)] md:flex-row">
          <p>
            © {year} {SITE.shortName}. {t('rights')}
          </p>
          <div className="flex items-center gap-4">
            <Link href={NAV_CTA.contact} className="hover:text-white">
              {tNav('contact')}
            </Link>
            <span className="opacity-40">·</span>
            <span>{t('builtNote')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
