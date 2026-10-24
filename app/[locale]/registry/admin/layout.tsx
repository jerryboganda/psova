import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { Link, redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/registry/guards';
import { AdminNav } from '@/components/registry/AdminNav';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/ui/GlassCard';
import { LogoutButton } from '@/components/registry/LogoutButton';

// Reads session/DB — never static.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
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
  if (!session) {
    redirect({ href: '/registry/login', locale });
    return null;
  }
  if (session.user.role !== 'admin') {
    const home = session.user.role === 'center' ? '/centre' : '/registry/clinician';
    return (
      <Section className="pt-28 md:pt-32">
        <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-amber-400/15 text-amber-300">
            <ShieldAlert className="size-7" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">{t('forbiddenTitle')}</h1>
          <p className="mb-6 text-[var(--color-muted)]">{t('forbiddenBody')}</p>
          <div className="flex flex-col items-center gap-4">
            <Link href={home} className="text-sm font-semibold text-[var(--color-cyan)] hover:underline">
              {t('goToDashboard')}
            </Link>
            <LogoutButton />
          </div>
        </GlassCard>
      </Section>
    );
  }

  return (
    <div className="pt-24 md:pt-28">
      <AdminNav />
      {children}
    </div>
  );
}
