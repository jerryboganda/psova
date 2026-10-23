'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { EyeOff, Eye, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  title: string;
  status: string;
  centre: string;
  createdAt: string;
  comments: { id: string; body: string; centre: string; hidden: boolean }[];
};

const btn = 'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10 disabled:opacity-60';

/** PSOVA moderation of the case-discussion board: hide or restore a post or a comment. */
export function AdminMdt({ rows }: { rows: Row[] }) {
  const t = useTranslations('RegistryAdmin.mdt');
  const format = useFormatter();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function act(kind: 'post' | 'comment', id: string, action: 'HIDE' | 'UNHIDE') {
    setBusy(id);
    setFailed(false);
    try {
      const res = await fetch(`/api/registry/admin/mdt/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, action }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {failed && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      {rows.map((p) => {
        const hidden = p.status === 'HIDDEN';
        return (
          <article key={p.id} className={cn('rounded-2xl border bg-white/[0.03] p-5', hidden ? 'border-[var(--color-rose)]/30' : 'border-white/10')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{p.title}</h2>
                <p className="text-xs text-[var(--color-faint)]">
                  {p.centre} · {format.dateTime(new Date(p.createdAt), { dateStyle: 'medium' })} · {t(`status.${p.status}`)}
                </p>
              </div>
              <button type="button" disabled={busy === p.id} onClick={() => act('post', p.id, hidden ? 'UNHIDE' : 'HIDE')} className={btn}>
                {busy === p.id ? <Loader2 className="size-3.5 animate-spin" /> : hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                {hidden ? t('unhide') : t('hide')}
              </button>
            </div>
            {p.comments.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                {p.comments.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 text-sm">
                    <p className={cn('min-w-0 flex-1', c.hidden && 'text-[var(--color-faint)] line-through')}>
                      <span className="font-medium">{c.centre}: </span>
                      {c.body}
                    </p>
                    <button type="button" disabled={busy === c.id} onClick={() => act('comment', c.id, c.hidden ? 'UNHIDE' : 'HIDE')} className={btn}>
                      {c.hidden ? t('unhide') : t('hide')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
