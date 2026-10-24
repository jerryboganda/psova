'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Check, X, Copy, AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { RecordView } from './RecordView';
import { RegistryBadge } from './RegistryBadge';
import { Dialog } from './Dialog';
import { fieldClass, labelClass } from './field';
import {
  ISSVA_CATEGORIES,
  SEVERITIES,
  DIAGNOSIS_BASES,
  BODY_SITES,
  ONSETS,
  CONDITION_SLUG_OPTIONS,
} from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import type { DecryptedRecord, DuplicateCandidate } from '@/lib/registry/patients';

type Detail = { record: DecryptedRecord; duplicates: DuplicateCandidate[] };

export function AdminRecordDetail({ id }: { id: string }) {
  const t = useTranslations('RegistryAdmin');
  const tc = useTranslations('RegistryCommon');
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [banner, setBanner] = useState<'done' | 'error' | null>(null);
  const [busy, setBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);

  const load = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/registry/admin/records/${id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setDetail({ record: data.record, duplicates: data.duplicates ?? [] });
      setState('ok');
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: unknown): Promise<boolean> {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/registry/admin/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setBanner('done');
      return true;
    } catch {
      setBanner('error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function patchStatusLocal(status: string) {
    setDetail((d) => (d ? { ...d, record: { ...d.record, status } } : d));
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--color-muted)]">
        <Loader2 className="size-5 animate-spin" /> {tc('loading')}
      </div>
    );
  }
  if (state === 'error' || !detail) {
    return <div className="rounded-2xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 p-6 text-center text-[var(--color-rose)]">{tc('error')}</div>;
  }

  const { record, duplicates } = detail;

  const canVerify = record.status === 'PENDING' || record.status === 'REJECTED';
  const canReject = record.status === 'PENDING' || record.status === 'VERIFIED';
  const canDuplicate = record.status === 'PENDING';

  const actions = (
    <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{t('record.actions')}</span>
        <RegistryBadge status={record.status as 'PENDING'} />
      </div>
      <div className="flex flex-wrap gap-2">
        {canVerify && (
          <button type="button" disabled={busy} onClick={async () => { if (await patch({ action: 'VERIFY' })) patchStatusLocal('VERIFIED'); }} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-cyan)] disabled:opacity-50">
            <Check className="size-4" /> {t('record.verify')}
          </button>
        )}
        {canReject && (
          <button type="button" disabled={busy} onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-rose)] disabled:opacity-50">
            <X className="size-4" /> {t('record.reject')}
          </button>
        )}
        {canDuplicate && (
          <button type="button" disabled={busy} onClick={() => setDupOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--color-fg)] disabled:opacity-50">
            <Copy className="size-4" /> {t('record.markDuplicate')}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--color-fg)] disabled:opacity-50">
          {t('record.edit')}
        </button>
        <button type="button" disabled={busy} onClick={() => setEraseOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-rose)] disabled:opacity-50">
          <Trash2 className="size-4" /> {t('record.erase')}
        </button>
      </div>
      {record.status === 'DUPLICATE' && (
        <p className="text-xs text-[var(--color-muted)]">{t('record.duplicateNote')}</p>
      )}
      {banner === 'done' && <p className="text-sm text-[var(--color-cyan)]">{t('record.done')}</p>}
      {banner === 'error' && <p className="text-sm text-[var(--color-rose)]">{t('record.error')}</p>}
    </div>
  );

  const dupBanner =
    record.possibleDuplicate && duplicates.length > 0 ? (
      <div className="rounded-[var(--radius-2xl)] border border-amber-400/30 bg-amber-400/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-amber-300">
          <AlertTriangle className="size-4" />
          <span className="text-sm font-semibold">{t('record.duplicateBanner')}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {duplicates.map((d) => (
            <li key={d.id} className="flex items-center gap-3 text-sm">
              <Link href={`/registry/admin/records/${d.id}`} className="font-mono text-xs text-[var(--color-cyan)] hover:underline" dir="ltr">
                {d.trackingCode}
              </Link>
              <RegistryBadge status={d.status as 'PENDING'} />
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div>
      <Link href="/registry/admin/records" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="size-4 rtl:-scale-x-100" /> {t('record.back')}
      </Link>

      <RecordView record={record} actions={actions} banner={dupBanner} />

      <RejectDialog open={rejectOpen} busy={busy} onClose={() => setRejectOpen(false)} onSubmit={async (publicReason, internalNote) => {
        if (await patch({ action: 'REJECT', publicReason, internalNote: internalNote || undefined })) {
          patchStatusLocal('REJECTED');
          setRejectOpen(false);
        }
      }} />

      <DuplicateDialog open={dupOpen} busy={busy} candidates={duplicates} onClose={() => setDupOpen(false)} onSubmit={async (canonicalId) => {
        if (await patch({ action: 'DUPLICATE', canonicalId })) {
          patchStatusLocal('DUPLICATE');
          setDupOpen(false);
        }
      }} />

      <EditDialog open={editOpen} busy={busy} record={record} onClose={() => setEditOpen(false)} onSubmit={async (payload) => {
        if (await patch({ action: 'UPDATE', ...payload })) {
          setEditOpen(false);
          load();
        }
      }} />

      <EraseDialog open={eraseOpen} busy={busy} onClose={() => setEraseOpen(false)} onSubmit={async (reason) => {
        if (await patch({ action: 'ERASE', reason })) {
          setEraseOpen(false);
          router.push('/registry/admin/records');
          router.refresh();
        }
      }} />
    </div>
  );
}

/* --------------------------------- dialogs -------------------------------- */

function DialogButtons({ onCancel, onConfirm, busy, confirmLabel, cancelLabel, disabled = false }: { onCancel: () => void; onConfirm: () => void; busy: boolean; confirmLabel: string; cancelLabel: string; disabled?: boolean }) {
  return (
    <>
      <button type="button" onClick={onCancel} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">{cancelLabel}</button>
      <button type="button" onClick={onConfirm} disabled={busy || disabled} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
      </button>
    </>
  );
}

function RejectDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (publicReason: string, internalNote: string) => void }) {
  const t = useTranslations('RegistryAdmin');
  const [publicReason, setPublicReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  return (
    <Dialog open={open} onClose={onClose} title={t('record.rejectTitle')} footer={<DialogButtons onCancel={onClose} onConfirm={() => onSubmit(publicReason, internalNote)} busy={busy} disabled={publicReason.trim().length < 5} confirmLabel={t('record.confirm')} cancelLabel={t('record.cancel')} />}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="rj-public" className={labelClass}>{t('record.publicReason')}</label>
          <textarea id="rj-public" rows={3} className={fieldClass} value={publicReason} onChange={(e) => setPublicReason(e.target.value)} />
        </div>
        <div>
          <label htmlFor="rj-internal" className={labelClass}>{t('record.internalNote')}</label>
          <textarea id="rj-internal" rows={2} className={fieldClass} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

function DuplicateDialog({ open, busy, candidates, onClose, onSubmit }: { open: boolean; busy: boolean; candidates: DuplicateCandidate[]; onClose: () => void; onSubmit: (canonicalId: string) => void }) {
  const t = useTranslations('RegistryAdmin');
  const [canonicalId, setCanonicalId] = useState('');
  return (
    <Dialog open={open} onClose={onClose} title={t('record.duplicateTitle')} footer={<DialogButtons onCancel={onClose} onConfirm={() => onSubmit(canonicalId.trim())} busy={busy} disabled={!canonicalId.trim()} confirmLabel={t('record.confirm')} cancelLabel={t('record.cancel')} />}>
      <div className="flex flex-col gap-3">
        <label htmlFor="dup-id" className={labelClass}>{t('record.canonicalCode')}</label>
        <input id="dup-id" dir="ltr" className={fieldClass} value={canonicalId} onChange={(e) => setCanonicalId(e.target.value)} placeholder="PSV-XXXX-XXXX" />
        {candidates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => (
              <button key={c.id} type="button" onClick={() => setCanonicalId(c.trackingCode)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-[var(--color-cyan)] hover:bg-white/10" dir="ltr">
                {c.trackingCode}
              </button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function EraseDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const t = useTranslations('RegistryAdmin');
  const [reason, setReason] = useState('');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('record.eraseTitle')}
      footer={<DialogButtons onCancel={onClose} onConfirm={() => onSubmit(reason)} busy={busy} disabled={reason.trim().length < 5} confirmLabel={t('record.eraseConfirm')} cancelLabel={t('record.cancel')} />}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-rose)]">{t('record.eraseBody')}</p>
        <div>
          <label htmlFor="erase-reason" className={labelClass}>{t('record.eraseReason')}</label>
          <textarea id="erase-reason" rows={3} className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

function EditDialog({ open, busy, record, onClose, onSubmit }: { open: boolean; busy: boolean; record: DecryptedRecord; onClose: () => void; onSubmit: (payload: Record<string, string>) => void }) {
  const t = useTranslations('RegistryAdmin');
  const tc = useTranslations('RegistryCommon');
  const te = useTranslations('RegistryEnroll');
  const locale = useLocale();
  const d0 = record.diagnoses[0];
  const [issvaCategory, setIssva] = useState(d0?.issvaCategory ?? 'UNCLASSIFIED');
  const [severity, setSeverity] = useState(d0?.severity ?? 'UNKNOWN');
  const [basis, setBasis] = useState(d0?.basis ?? 'UNKNOWN');
  const [conditionSlug, setCondition] = useState(d0?.conditionSlug ?? 'not-sure');
  const [bodySite, setBodySite] = useState(d0?.bodySite ?? 'other');
  const [onset, setOnset] = useState(d0?.onset ?? 'UNKNOWN');
  const [internalNote, setInternalNote] = useState(record.internalNote ?? '');

  const conditionLabel = (value: string) => {
    if (value === 'other') return te('conditionOptions.other');
    if (value === 'not-sure') return te('conditionOptions.notSure');
    const c = CONDITIONS.find((x) => x.slug === value);
    return c ? localized(c.name, locale) : value;
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('record.updateTitle')} footer={<DialogButtons onCancel={onClose} onConfirm={() => onSubmit({ issvaCategory, severity, basis, conditionSlug, bodySite, onset, internalNote })} busy={busy} confirmLabel={t('record.confirm')} cancelLabel={t('record.cancel')} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectRow label="issva" value={issvaCategory} onChange={setIssva} options={ISSVA_CATEGORIES} render={(v) => tc(`issva.${v}`)} />
        <SelectRow label="severity" value={severity} onChange={setSeverity} options={SEVERITIES} render={(v) => tc(`severity.${v}`)} />
        <SelectRow label="basis" value={basis} onChange={setBasis} options={DIAGNOSIS_BASES} render={(v) => tc(`basis.${v}`)} />
        <SelectRow label="bodySite" value={bodySite} onChange={setBodySite} options={BODY_SITES} render={(v) => tc(`bodySites.${v}`)} />
        <SelectRow label="onset" value={onset} onChange={setOnset} options={ONSETS} render={(v) => tc(`onsets.${v}`)} />
        <SelectRow label="condition" value={conditionSlug} onChange={setCondition} options={CONDITION_SLUG_OPTIONS} render={conditionLabel} />
      </div>
      <div className="mt-4">
        <label htmlFor="ed-note" className={labelClass}>{t('record.internalNote')}</label>
        <textarea id="ed-note" rows={2} className={fieldClass} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
      </div>
    </Dialog>
  );
}

function SelectRow({ label, value, onChange, options, render }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; render: (v: string) => string }) {
  const tr = useTranslations('RegistryRecord');
  return (
    <div>
      <label className={labelClass}>{tr(`fields.${label}`)}</label>
      <select className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{render(o)}</option>)}
      </select>
    </div>
  );
}
