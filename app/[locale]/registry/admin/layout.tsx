import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/registry/guards';
import { AdminNav } from '@/components/registry/AdminNav';

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

  const session = await getSession(await headers());
  if (!session || session.user.role !== 'admin') {
    redirect({ href: '/registry/login', locale });
    return null;
  }

  return (
    <div className="pt-24 md:pt-28">
      <AdminNav />
      {children}
    </div>
  );
}
