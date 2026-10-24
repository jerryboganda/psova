'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Dialog } from './Dialog';
import { fieldClass, labelClass } from './field';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  publicCode: string;
  centerId: string;
  trackingCode: string;
  centre: { name: string; city: string };
  treatment: string;
  estimatedCostPkr: number;
  fundedPkr: number;
  status: string;
  blurbEn: string;
  blurbUr: string | null;
  sponsorName: string | null;
  showSponsor: boolean;
  statusReason: string | null;
  createdAt: string;
};

type Mode = 'APPROVE' | 'REJECT' | 'RECORD_FUNDING' | 'CLOSE';

const btn = 'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold';
const ok = `${btn} border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]`;
const danger = `${btn} border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 text-[var(--color-rose)]`;
const plain = `${btn} border-white/10 bg-white/5`;

/** PSOVA review of patient support-fund requests: approve (editing the public text), reject, record donations, close. */
export function AdminSupport({ rows }: { rows: Row[] }) {
  const t = useTranslations('RegistryAdmin.support');
  const format = useFormatter();
  const router = useRouter();

  const [dlg, setDlg] = useState<{ row: Row; mode: Mode } | null>(null);
  const [reason, setReason] = useState('');
  const [cost, setCost] = useState('');
  const [blurbEn, setBlurbEn] = useState('');
  const [blurbUr, setBlurbUr] = useState('');
  const [amount, setAmount] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [showSponsor, setShowSponsor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  function open(row: Row, mode: Mode) {
    setReason('');
    setCost(String(row.estimatedCostPkr));
    setBlurbEn(row.blurbEn);
    setBlurbUr(row.blurbUr ?? '');
    setAmount('');
    setSponsor(row.sponsorName ?? '');
    setShowSponsor(row.showSponsor);
    setFailed(false);
    setDlg({ row, mode });
  }

  function body(mode: Mode): Record<string, unknown> {
    switch (mode) {
      case 'APPROVE':
        return { action: mode, estimatedCostPkr: Number(cost), blurbEn, blurbUr };
      case 'REJECT':
        return { action: mode, reason };
      case 'RECORD_FUNDING':
        return { action: mode, amountPkr: Number(amount), showSponsor, ...(sponsor.trim() ? { sponsorName: sponsor.trim() } : {}) };
      default:
        return { action: mode, ...(reason.trim() ? { reason } : {}) };
    }
  }

  async function apply() {
    if (!dlg) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/registry/admin/support/${dlg.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body(dlg.mode)),
      });
      if (!res.ok) throw new Error();
      setDlg(null);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const titles = { APPROVE: 'approveTitle', REJECT: 'rejectTitle', RECORD_FUNDING: 'fundingTitle', CLOSE: 'closeTitle' } as const;
  const disabled =
    busy ||
    (dlg?.mode === 'REJECT' && reason.trim().length < 5) ||
    (dlg?.mode === 'RECORD_FUNDING' && !(Number(amount) >= 1)) ||
    (dlg?.mode === 'APPROVE' && (blurbEn.trim().length < 40 || !(Number(cost) >= 1000)));

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-[var(--color-muted)]">{t('empty')}</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{r.treatment}</h2>
                <p className="text-xs text-[var(--color-faint)]">
                  <span dir="ltr" className="font-mono">{r.publicCode}</span> ·{' '}
                  <Link href={`/registry/admin/centres/${r.centerId}`} className="hover:text-[var(--color-fg)] hover:underline">
                    {r.centre.name}
                  </Link>
                  , {r.centre.city} ·{' '}
                  <span dir="ltr" className="font-mono">{r.trackingCode}</span> ·{' '}
                  {format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="text-end text-sm">
                <p className="font-semibold" dir="ltr">PKR {r.fundedPkr.toLocaleString('en-US')} / {r.estimatedCostPkr.toLocaleString('en-US')}</p>
                <p className="text-xs text-[var(--color-muted)]">{t(`status.${r.status}`)}</p>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-muted)]">{r.blurbEn}</p>
            {r.blurbUr && <p dir="rtl" className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-muted)]">{r.blurbUr}</p>}
            {r.statusReason && <p className="mt-2 text-xs text-[var(--color-rose)]">{r.statusReason}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {r.status === 'SUBMITTED' && (
                <>
                  <button type="button" onClick={() => open(r, 'APPROVE')} className={ok}>{t('approve')}</button>
                  <button type="button" onClick={() => open(r, 'REJECT')} className={danger}>{t('reject')}</button>
                </>
              )}
              {r.status === 'APPROVED' && (
                <button type="button" onClick={() => open(r, 'RECORD_FUNDING')} className={ok}>{t('recordFunding')}</button>
              )}
              {(r.status === 'APPROVED' || r.status === 'FUNDED') && (
                <button type="button" onClick={() => open(r, 'CLOSE')} className={plain}>{t('close')}</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={dlg !== null}
        onClose={() => setDlg(null)}
        title={dlg ? t(titles[dlg.mode]) : ''}
        footer={
          <>
            <button type="button" onClick={() => setDlg(null)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium">
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={disabled}
              className={cn('inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60', dlg?.mode === 'REJECT' ? 'bg-[var(--color-rose)]' : 'bg-brand')}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t('confirm')}
            </button>
          </>
        }
      >
        {dlg && <p className="mb-4 text-sm font-medium">{dlg.row.treatment} · <span dir="ltr" className="font-mono">{dlg.row.publicCode}</span></p>}

        {dlg?.mode === 'APPROVE' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted)]">{t('approveBody')}</p>
            <div>
              <label htmlFor="as-cost" className={labelClass}>{t('cost')}</label>
              <input id="as-cost" type="number" min={1000} dir="ltr" className={fieldClass} value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div>
              <label htmlFor="as-en" className={labelClass}>{t('blurbEn')}</label>
              <textarea id="as-en" rows={5} className={fieldClass} value={blurbEn} onChange={(e) => setBlurbEn(e.target.value)} />
            </div>
            <div>
              <label htmlFor="as-ur" className={labelClass}>{t('blurbUr')}</label>
              <textarea id="as-ur" dir="rtl" rows={5} className={fieldClass} value={blurbUr} onChange={(e) => setBlurbUr(e.target.value)} />
            </div>
          </div>
        )}

        {dlg?.mode === 'RECORD_FUNDING' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted)]">{t('fundingBody')}</p>
            <div>
              <label htmlFor="as-amount" className={labelClass}>{t('amount')}</label>
              <input id="as-amount" type="number" min={1} dir="ltr" className={fieldClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label htmlFor="as-sponsor" className={labelClass}>{t('sponsor')}</label>
              <input id="as-sponsor" maxLength={120} className={fieldClass} value={sponsor} onChange={(e) => setSponsor(e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={showSponsor} onChange={(e) => setShowSponsor(e.target.checked)} className="size-4 accent-[var(--color-cyan)]" />
              {t('showSponsor')}
            </label>
          </div>
        )}

        {(dlg?.mode === 'REJECT' || dlg?.mode === 'CLOSE') && (
          <div>
            <label htmlFor="as-reason" className={labelClass}>{t(dlg.mode === 'REJECT' ? 'reasonRequired' : 'reasonOptional')}</label>
            <textarea id="as-reason" rows={3} className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}

        {failed && <p role="alert" className="mt-3 text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </Dialog>
    </>
  );
}
