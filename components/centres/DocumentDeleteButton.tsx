'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

/** Permanently remove a document (owner / doctor). Confirms first; the file and its row are deleted. */
export function DocumentDeleteButton({ id }: { id: string }) {
  const t = useTranslations('Centres.documents');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    if (!window.confirm(t('deleteConfirm'))) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/centre/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        aria-label={t('delete')}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-rose)] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        {t('delete')}
      </button>
      {failed && <span role="alert" className="text-xs text-[var(--color-rose)]">{t('error')}</span>}
    </span>
  );
}
