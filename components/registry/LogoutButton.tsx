'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/registry/auth-client';
import { cn } from '@/lib/utils';

export function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations('RegistryAuth');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.push('/registry/login');
        router.refresh();
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-60',
        className,
      )}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4 rtl:-scale-x-100" />}
      {t('logout')}
    </button>
  );
}
