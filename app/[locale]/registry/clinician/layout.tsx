import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { redirect } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { LogoutButton } from '@/components/registry/LogoutButton';
import { ClinicianNav } from '@/components/registry/ClinicianNav';
import { getSession } from '@/lib/registry/guards';
import { prisma } from '@/lib/registry/db';
import { SITE } from '@/data/site';

// Reads session/DB — never static.
export const dynamic = 'force-dynamic';

export default async function ClinicianLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('RegistryAuth');

  const session = await getSession(await headers());
  const role = session?.user.role;
  if (!session || (role !== 'admin' && role !== 'clinician')) {
    redirect({ href: '/registry/login', locale });
    return null;
  }

  // Admins act as clinicians without a profile; clinicians must be approved.
  let approved = role === 'admin';
  if (role === 'clinician') {
    const profile = await prisma.clinicianProfile.findUnique({
      where: { userId: session.user.id },
      select: { approved: true },
    });
    approved = Boolean(profile?.approved);
  }

  if (!approved) {
    return (
      <Section className="pt-28 md:pt-32">
        <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-amber-400/15 text-amber-300">
            <ShieldAlert className="size-7" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">{t('pendingTitle')}</h1>
          <p className="mb-6 text-[var(--color-muted)]">{t('pendingBody')}</p>
          <div className="flex flex-col items-center gap-4">
            <a href={`mailto:${SITE.email}`} className="text-sm text-[var(--color-cyan)] hover:underline">
              {t('pendingContact')}
            </a>
            <LogoutButton />
          </div>
        </GlassCard>
      </Section>
    );
  }

  return (
    <div className="pt-24 md:pt-28">
      <ClinicianNav />
      {children}
    </div>
  );
}
