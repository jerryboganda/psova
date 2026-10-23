'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { DOCUMENT_KINDS } from '@/lib/registry/constants';
import { fieldClass, labelClass } from '@/components/registry/field';

const MAX_BYTES = 10 * 1024 * 1024; // mirrored from storage.ts; the server is authoritative

/** Upload a photo or report for a patient. Type is verified on the server from the file's bytes. */
export function DocumentUpload({ patientId }: { patientId: string }) {
  const t = useTranslations('Centres.documents');
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof DOCUMENT_KINDS)[number]>('PHOTO');
  const [teaching, setTeaching] = useState(false);
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; message?: string }>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setState({ kind: 'error', message: t('tooLarge') });
      return;
    }
    setState({ kind: 'sending' });
    const body = new FormData();
    body.set('file', file);
    body.set('kind', kind);
    body.set('consentForTeaching', String(teaching));
    try {
      const res = await fetch(`/api/centre/patients/${patientId}/documents`, { method: 'POST', body });
      if (res.ok) {
        if (input.current) input.current.value = '';
        setTeaching(false);
        setState({ kind: 'ok', message: t('uploaded') });
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      const message =
        data?.error === 'payload-too-large'
          ? t('tooLarge')
          : data?.error === 'quota-exceeded'
            ? t('quota')
            : data?.error === 'validation'
              ? t('badType')
              : data?.error === 'unavailable'
                ? t('unavailable')
                : t('error');
      setState({ kind: 'error', message });
    } catch {
      setState({ kind: 'error', message: t('error') });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="doc-file" className={labelClass}>{t('file')}</label>
        <input
          id="doc-file"
          ref={input}
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-[var(--color-faint)]">{t('fileHint')}</p>
      </div>
      <div>
        <label htmlFor="doc-kind" className={labelClass}>{t('kind')}</label>
        <select id="doc-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={fieldClass}>
          {DOCUMENT_KINDS.map((k) => (
            <option key={k} value={k}>{t(`kinds.${k}`)}</option>
          ))}
        </select>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-muted)]">
        <input type="checkbox" checked={teaching} onChange={(e) => setTeaching(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-cyan)]" />
        <span>{t('teaching')}</span>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state.kind === 'sending'}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {state.kind === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {state.kind === 'sending' ? t('uploading') : t('upload')}
        </button>
        {state.kind === 'ok' && <p role="status" className="text-sm text-[var(--color-cyan)]">{state.message}</p>}
        {state.kind === 'error' && <p role="alert" className="text-sm text-[var(--color-rose)]">{state.message}</p>}
      </div>
    </form>
  );
}
