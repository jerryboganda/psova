import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hourglass, ShieldAlert } from 'lucide-react';
import { redirect } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { LogoutButton } from '@/components/registry/LogoutButton';
import { getSession } from '@/lib/registry/guards';
import { prisma } from '@/lib/registry/db';
import { SITE } from '@/data/site';

// Reads session/DB — never static.
export const dynamic = 'force-dynamic';

export default async function CentreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Centres.dash');

  const session = await getSession(await headers());
  if (!session || session.user.role !== 'center') {
    redirect({ href: '/registry/login', locale });
    return null;
  }

  const member = await prisma.centerMember.findUnique({
    where: { userId: session.user.id },
    select: { active: true, center: { select: { status: true, statusReason: true } } },
  });
  if (!member || !member.active) {
    redirect({ href: '/registry/login', locale });
    return null;
  }

  const { status, statusReason } = member.center;
  if (status !== 'APPROVED') {
    const Icon = status === 'APPLIED' ? Hourglass : ShieldAlert;
    return (
      <Section className="pt-28 md:pt-32">
        <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-amber-400/15 text-amber-300">
            <Icon className="size-7" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">{t(`status.${status}.title`)}</h1>
          <p className="mb-4 text-[var(--color-muted)]">{t(`status.${status}.body`)}</p>
          {statusReason && (
            <p className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-start text-sm">
              <span className="font-semibold">{t('reason')}: </span>
              {statusReason}
            </p>
          )}
          <div className="flex flex-col items-center gap-4">
            <a href={`mailto:${SITE.email}`} className="text-sm text-[var(--color-cyan)] hover:underline">
              {t('contact')}
            </a>
            <LogoutButton />
          </div>
        </GlassCard>
      </Section>
    );
  }

  return (
    <div className="pt-24 md:pt-28">
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold">{t('title')}</span>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
