'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { fieldClass } from '@/components/registry/field';

export function MdtCommentForm({ postId }: { postId: string }) {
  const t = useTranslations('Centres.mdt');
  const router = useRouter();
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(`/api/centre/mdt/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      setBody('');
      setState('idle');
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        aria-label={t('commentLabel')}
        placeholder={t('commentLabel')}
        required
        minLength={2}
        maxLength={2000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={fieldClass}
      />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={state === 'sending' || body.trim().length < 2} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t('comment')}
        </button>
        {state === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </div>
    </form>
  );
}

/** Author centre only: close or reopen the discussion. */
export function MdtStatusButton({ postId, status }: { postId: string; status: string }) {
  const t = useTranslations('Centres.mdt');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const resolved = status === 'RESOLVED';

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/centre/mdt/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: resolved ? 'REOPEN' : 'RESOLVE' }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-60">
      {busy ? <Loader2 className="size-4 animate-spin" /> : resolved ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
      {resolved ? t('reopen') : t('resolve')}
    </button>
  );
}
