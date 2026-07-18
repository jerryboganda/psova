'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, ShieldCheck, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { GlassCard } from '@/components/ui/GlassCard';

/** Success screen: giant tracking code, copy button, save warning, status link. */
export function TrackingCodeCard({
  code,
  emailProvided = false,
  note,
}: {
  code: string;
  emailProvided?: boolean;
  /** Optional extra line, e.g. clinician "give this code to the family". */
  note?: string;
}) {
  const t = useTranslations('RegistryEnroll');
  const tc = useTranslations('RegistryCommon');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — code is visible on screen */
    }
  }

  return (
    <GlassCard interactive={false} className="mx-auto max-w-xl text-center">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
        <ShieldCheck className="size-7" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">{t('successTitle')}</h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">{t('successSave')}</p>

      <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
        <span dir="ltr" className="font-display text-2xl font-bold tracking-[0.2em] text-[var(--color-fg)] sm:text-3xl">
          {code}
        </span>
      </div>

      <button
        type="button"
        onClick={copy}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)] transition-colors hover:bg-white/10"
      >
        {copied ? <Check className="size-4 text-[var(--color-cyan)]" /> : <Copy className="size-4" />}
        {copied ? tc('copied') : t('successCopy')}
      </button>

      {note && <p className="mb-4 text-sm text-[var(--color-muted)]">{note}</p>}
      {emailProvided && <p className="mb-4 text-xs text-[var(--color-faint)]">{t('successEmailNote')}</p>}

      <div>
        <Link
          href="/registry/status"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-cyan)] hover:underline"
        >
          <Search className="size-4" />
          {t('successStatusLink')}
        </Link>
      </div>
    </GlassCard>
  );
}
