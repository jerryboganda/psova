import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/registry/guards';

// Reads session/DB — never static. The AdminNav sidebar is added in P5.
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

  const session = await getSession(await headers());
  if (!session || session.user.role !== 'admin') {
    redirect({ href: '/registry/login', locale });
    return null;
  }

  return <>{children}</>;
}
