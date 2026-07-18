'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Check, X, Loader2 } from 'lucide-react';
import { DataTable, type Column } from './DataTable';
import { Dialog } from './Dialog';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  name: string;
  email: string;
  pmcNumber: string;
  specialty: string;
  facility: string;
  city: string;
  province: string;
  approved: boolean;
  createdAt: string;
};

type Confirm = { row: Row; mode: 'APPROVE' | 'REJECT' } | null;

export function AdminClinicians() {
  const t = useTranslations('RegistryAdmin');
  const tc = useTranslations('RegistryCommon');
  const format = useFormatter();

  const [filter, setFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (f) params.set('approved', f);
      const res = await fetch(`/api/registry/admin/clinicians?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setRows(data.items as Row[]);
        setTotal(data.total as number);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);
  useEffect(() => {
    load(page, filter);
  }, [page, filter, load]);

  async function apply() {
    if (!confirm) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/registry/admin/clinicians/${confirm.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirm.mode }),
      });
      if (res.ok) {
        setConfirm(null);
        load(page, filter);
      }
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Row>[] = [
    { key: 'name', header: t('clinicians.name'), render: (r) => r.name },
    { key: 'email', header: t('clinicians.email'), render: (r) => <span dir="ltr" className="text-xs">{r.email}</span> },
    { key: 'pmc', header: t('clinicians.pmc'), render: (r) => <span dir="ltr" className="font-mono text-xs">{r.pmcNumber}</span> },
    { key: 'specialty', header: t('clinicians.specialty'), render: (r) => r.specialty },
    { key: 'facility', header: t('clinicians.facility'), render: (r) => r.facility },
    { key: 'province', header: t('clinicians.province'), render: (r) => tc(`provinces.${r.province}`) },
    { key: 'date', header: t('clinicians.date'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' }) },
    {
      key: 'actions',
      header: t('clinicians.status'),
      render: (r) =>
        r.approved ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-cyan)]">
            {t('clinicians.approved')}
          </span>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirm({ row: r, mode: 'APPROVE' })} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-cyan)]">
              <Check className="size-3.5" /> {t('clinicians.approve')}
            </button>
            <button type="button" onClick={() => setConfirm({ row: r, mode: 'REJECT' })} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-rose)]">
              <X className="size-3.5" /> {t('clinicians.reject')}
            </button>
          </div>
        ),
    },
  ];

  const filters: { key: '' | 'true' | 'false'; label: string }[] = [
    { key: '', label: t('clinicians.filterAll') },
    { key: 'false', label: t('clinicians.filterPending') },
    { key: 'true', label: t('clinicians.filterApproved') },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key || 'all'}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.key ? 'bg-brand text-white' : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={t('clinicians.empty')}
        loading={loading}
        pagination={{ page, pageSize: 20, total, onPage: setPage }}
      />

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.mode === 'APPROVE' ? t('clinicians.confirmApproveTitle') : t('clinicians.confirmRejectTitle')}
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('record.cancel')}
            </button>
            <button type="button" onClick={apply} disabled={busy} className={cn('inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60', confirm?.mode === 'REJECT' ? 'bg-[var(--color-rose)]' : 'bg-brand')}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {confirm?.mode === 'APPROVE' ? t('clinicians.approve') : t('clinicians.reject')}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">
          {confirm?.mode === 'APPROVE' ? t('clinicians.confirmApproveBody') : t('clinicians.confirmRejectBody')}
        </p>
        {confirm && <p className="mt-3 text-sm font-medium text-[var(--color-fg)]">{confirm.row.name} · {confirm.row.email}</p>}
      </Dialog>
    </div>
  );
}
