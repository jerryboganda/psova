import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { CircleCheck, CircleX } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { TierBadge } from '@/components/centres/TierBadge';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/registry/db';
import { isPubliclyListed, membershipState } from '@/lib/registry/membership';
import { localized } from '@/lib/utils';

// Opened from the QR code on a centre's certificate — must reflect the live state.
export const dynamic = 'force-dynamic';

export default async function VerifyCentrePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres.verify');
  const format = await getFormatter();

  const center = await prisma.center.findUnique({
    where: { slug },
    select: {
      slug: true,
      nameEn: true,
      nameUr: true,
      city: true,
      tier: true,
      status: true,
      approvedAt: true,
      membershipExpiresAt: true,
    },
  });
  const valid = center ? isPubliclyListed(center.status, membershipState(center.membershipExpiresAt)) : false;

  return (
    <Section className="pt-28 md:pt-32">
      <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
        <div
          className={`mx-auto mb-5 grid size-14 place-items-center rounded-full ${
            valid ? 'bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]' : 'bg-[var(--color-rose)]/15 text-[var(--color-rose)]'
          }`}
        >
          {valid ? <CircleCheck className="size-7" /> : <CircleX className="size-7" />}
        </div>
        <h1 className="mb-3 text-2xl font-bold">{valid ? t('validTitle') : t('invalidTitle')}</h1>
        {center && valid ? (
          <>
            <p className="text-lg font-semibold">{localized({ en: center.nameEn, ur: center.nameUr || center.nameEn }, locale)}</p>
            <p className="mb-4 text-sm text-[var(--color-muted)]">{center.city}</p>
            <TierBadge tier={center.tier} className="mx-auto" />
            {center.membershipExpiresAt && (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                {t('validUntil', { date: format.dateTime(center.membershipExpiresAt, { dateStyle: 'medium' }) })}
              </p>
            )}
            <Link href={`/centres/${center.slug}`} className="mt-5 inline-block text-sm text-[var(--color-cyan)] hover:underline">
              {t('viewProfile')}
            </Link>
          </>
        ) : (
          <p className="text-[var(--color-muted)]">{t('invalidBody')}</p>
        )}
      </GlassCard>
    </Section>
  );
}
