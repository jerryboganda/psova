'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RecordView } from './RecordView';
import type { DecryptedRecord } from '@/lib/registry/patients';

/** Fetches and renders one decrypted case for a clinician (own record). */
export function CaseDetailClient({ id, backHref }: { id: string; backHref: string }) {
  const tc = useTranslations('RegistryCommon');
  const [record, setRecord] = useState<DecryptedRecord | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/registry/cases/${id}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error();
        setRecord(data.record as DecryptedRecord);
        setState('ok');
      } catch {
        setState('error');
      }
    })();
  }, [id]);

  return (
    <div>
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {tc('back')}
      </Link>

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-20 text-[var(--color-muted)]">
          <Loader2 className="size-5 animate-spin" />
          {tc('loading')}
        </div>
      )}
      {state === 'error' && (
        <div className="rounded-2xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 p-6 text-center text-[var(--color-rose)]">
          {tc('error')}
        </div>
      )}
      {state === 'ok' && record && <RecordView record={record} />}
    </div>
  );
}
