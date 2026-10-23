'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { DataTable, type Column } from './DataTable';
import { Dialog } from './Dialog';
import { fieldClass, labelClass } from './field';
import { CENTER_TIERS } from '@/lib/registry/constants';
import { cn } from '@/lib/utils';

type CenterRow = {
  id: string;
  nameEn: string;
  type: string;
  city: string;
  province: string;
  licenceNumber: string;
  headDoctorName: string;
  headDoctorPmc: string;
  ownerName: string | null;
  ownerEmail: string | null;
  status: string;
  tier: string;
  statusReason: string | null;
  membershipExpiresAt: string | null;
  membership: string;
  pendingPayments: number;
  createdAt: string;
};

type PaymentRow = {
  id: string;
  centerName: string;
  city: string;
  amount: number;
  method: string;
  txnRef: string;
  paidOn: string;
  status: string;
  createdAt: string;
};

type CenterMode = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REINSTATE' | 'SET_TIER' | 'EXTEND';
type PaymentMode = 'VERIFY' | 'REJECT';

const chip = (active: boolean) =>
  cn(
    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'bg-brand text-white'
      : 'border border-white/10 bg-white/5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
  );
const actionBtn =
  'inline-flex items-center gap-1 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-cyan)]';
const dangerBtn =
  'inline-flex items-center gap-1 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-rose)]';

export function AdminCentres() {
  const t = useTranslations('RegistryAdmin.centres');
  const [tab, setTab] = useState<'centres' | 'payments'>('centres');
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('centres')} className={chip(tab === 'centres')}>
          {t('tabCentres')}
        </button>
        <button type="button" onClick={() => setTab('payments')} className={chip(tab === 'payments')}>
          {t('tabPayments')}
        </button>
      </div>
      {tab === 'centres' ? <CentresTab /> : <PaymentsTab />}
    </div>
  );
}

/* --------------------------------- centres -------------------------------- */

function CentresTab() {
  const t = useTranslations('RegistryAdmin.centres');
  const tc = useTranslations('RegistryCommon');
  const tcn = useTranslations('Centres');
  const format = useFormatter();

  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CenterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dlg, setDlg] = useState<{ row: CenterRow; mode: CenterMode } | null>(null);
  const [reason, setReason] = useState('');
  const [tier, setTier] = useState('MEMBER');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [days, setDays] = useState('365');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (f) params.set('status', f);
      const res = await fetch(`/api/registry/admin/centres?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setRows(data.items as CenterRow[]);
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

  function open(row: CenterRow, mode: CenterMode) {
    setReason('');
    setTier(row.tier);
    setLat('');
    setLng('');
    setDays('365');
    setFailed(false);
    setDlg({ row, mode });
  }

  function buildBody(mode: CenterMode): Record<string, unknown> {
    switch (mode) {
      case 'APPROVE':
        return {
          action: mode,
          tier,
          ...(lat.trim() ? { lat: Number(lat) } : {}),
          ...(lng.trim() ? { lng: Number(lng) } : {}),
        };
      case 'REJECT':
      case 'SUSPEND':
        return { action: mode, reason };
      case 'SET_TIER':
        return { action: mode, tier };
      case 'EXTEND':
        return { action: mode, days: Number(days) };
      default:
        return { action: mode };
    }
  }

  async function apply() {
    if (!dlg) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/registry/admin/centres/${dlg.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(dlg.mode)),
      });
      if (res.ok) {
        setDlg(null);
        load(page, filter);
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<CenterRow>[] = [
    {
      key: 'name',
      header: t('name'),
      render: (r) => (
        <div>
          <div className="font-medium">{r.nameEn}</div>
          <div className="text-xs text-[var(--color-faint)]">
            {r.city} · {tc(`provinces.${r.province}`)}
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: t('owner'),
      render: (r) => (
        <div>
          <div>{r.ownerName}</div>
          <div dir="ltr" className="text-xs text-[var(--color-faint)]">{r.ownerEmail}</div>
        </div>
      ),
    },
    {
      key: 'creds',
      header: t('licence'),
      render: (r) => (
        <div className="text-xs">
          <div dir="ltr" className="font-mono">{r.licenceNumber}</div>
          <div>{r.headDoctorName}</div>
          <div dir="ltr" className="font-mono text-[var(--color-faint)]">{r.headDoctorPmc}</div>
        </div>
      ),
    },
    { key: 'status', header: t('status'), render: (r) => t(`statuses.${r.status}`) },
    {
      key: 'membership',
      header: t('membership'),
      render: (r) => (
        <div className="text-xs">
          <div>{t(`states.${r.membership}`)}</div>
          {r.membershipExpiresAt && (
            <div className="text-[var(--color-faint)]">
              {format.dateTime(new Date(r.membershipExpiresAt), { dateStyle: 'medium' })}
            </div>
          )}
          {r.pendingPayments > 0 && (
            <div className="text-amber-300">{t('pendingPayments', { count: r.pendingPayments })}</div>
          )}
        </div>
      ),
    },
    { key: 'tier', header: t('tier'), render: (r) => tcn(`tiers.${r.tier}`) },
    { key: 'date', header: t('date'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' }) },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {(r.status === 'APPLIED' || r.status === 'REJECTED') && (
            <button type="button" onClick={() => open(r, 'APPROVE')} className={actionBtn}>{t('approve')}</button>
          )}
          {r.status === 'APPLIED' && (
            <button type="button" onClick={() => open(r, 'REJECT')} className={dangerBtn}>{t('reject')}</button>
          )}
          {r.status === 'APPROVED' && (
            <>
              <button type="button" onClick={() => open(r, 'SET_TIER')} className={actionBtn}>{t('setTier')}</button>
              <button type="button" onClick={() => open(r, 'EXTEND')} className={actionBtn}>{t('extend')}</button>
              <button type="button" onClick={() => open(r, 'SUSPEND')} className={dangerBtn}>{t('suspend')}</button>
            </>
          )}
          {r.status === 'SUSPENDED' && (
            <button type="button" onClick={() => open(r, 'REINSTATE')} className={actionBtn}>{t('reinstate')}</button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    { key: '', label: t('filterAll') },
    { key: 'APPLIED', label: t('filterApplied') },
    { key: 'APPROVED', label: t('filterApproved') },
    { key: 'REJECTED', label: t('filterRejected') },
    { key: 'SUSPENDED', label: t('filterSuspended') },
  ];

  const titleKey = {
    APPROVE: 'approveTitle',
    REJECT: 'rejectTitle',
    SUSPEND: 'suspendTitle',
    REINSTATE: 'reinstateTitle',
    SET_TIER: 'tierTitle',
    EXTEND: 'extendTitle',
  } as const;
  const needsReason = dlg?.mode === 'REJECT' || dlg?.mode === 'SUSPEND';
  const confirmDisabled =
    busy ||
    (needsReason && reason.trim().length < 5) ||
    (dlg?.mode === 'EXTEND' && !(Number(days) >= 1 && Number(days) <= 366));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key || 'all'} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={t('empty')}
        loading={loading}
        pagination={{ page, pageSize: 20, total, onPage: setPage }}
      />

      <Dialog
        open={dlg !== null}
        onClose={() => setDlg(null)}
        title={dlg ? t(titleKey[dlg.mode]) : ''}
        footer={
          <>
            <button type="button" onClick={() => setDlg(null)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={confirmDisabled}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60',
                dlg?.mode === 'REJECT' || dlg?.mode === 'SUSPEND' ? 'bg-[var(--color-rose)]' : 'bg-brand',
              )}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t('confirm')}
            </button>
          </>
        }
      >
        {dlg && <p className="mb-4 text-sm font-medium">{dlg.row.nameEn} · {dlg.row.city}</p>}
        {dlg?.mode === 'APPROVE' && <p className="mb-4 text-sm text-[var(--color-muted)]">{t('approveBody')}</p>}
        {(dlg?.mode === 'APPROVE' || dlg?.mode === 'SET_TIER') && (
          <div className="mb-4">
            <label htmlFor="c-tier" className={labelClass}>{t('tierLabel')}</label>
            <select id="c-tier" className={fieldClass} value={tier} onChange={(e) => setTier(e.target.value)}>
              {CENTER_TIERS.map((v) => (
                <option key={v} value={v}>{tcn(`tiers.${v}`)}</option>
              ))}
            </select>
          </div>
        )}
        {dlg?.mode === 'APPROVE' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-lat" className={labelClass}>{t('latitude')}</label>
              <input id="c-lat" dir="ltr" inputMode="decimal" className={fieldClass} value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <label htmlFor="c-lng" className={labelClass}>{t('longitude')}</label>
              <input id="c-lng" dir="ltr" inputMode="decimal" className={fieldClass} value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
        )}
        {needsReason && (
          <div>
            <label htmlFor="c-reason" className={labelClass}>{t('reason')}</label>
            <textarea id="c-reason" rows={3} className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        {dlg?.mode === 'EXTEND' && (
          <div>
            <label htmlFor="c-days" className={labelClass}>{t('extendDays')}</label>
            <input id="c-days" type="number" min={1} max={366} dir="ltr" className={fieldClass} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        )}
        {failed && <p role="alert" className="mt-3 text-sm text-[var(--color-rose)]">{t('error')}</p>}
      </Dialog>
    </>
  );
}

/* -------------------------------- payments -------------------------------- */

function PaymentsTab() {
  const t = useTranslations('RegistryAdmin.payments');
  const tm = useTranslations('Centres.apply.payment.methods');
  const tcc = useTranslations('RegistryAdmin.centres');
  const format = useFormatter();

  const [filter, setFilter] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dlg, setDlg] = useState<{ row: PaymentRow; mode: PaymentMode } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), status: f });
      const res = await fetch(`/api/registry/admin/center-payments?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setRows(data.items as PaymentRow[]);
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
    if (!dlg) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/registry/admin/center-payments/${dlg.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dlg.mode === 'VERIFY' ? { action: 'VERIFY' } : { action: 'REJECT', reason }),
      });
      if (res.ok) {
        setDlg(null);
        load(page, filter);
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<PaymentRow>[] = [
    {
      key: 'centre',
      header: t('centre'),
      render: (r) => (
        <div>
          <div className="font-medium">{r.centerName}</div>
          <div className="text-xs text-[var(--color-faint)]">{r.city}</div>
        </div>
      ),
    },
    { key: 'amount', header: t('amount'), render: (r) => <span dir="ltr">PKR {r.amount.toLocaleString('en-US')}</span> },
    { key: 'method', header: t('method'), render: (r) => tm(r.method) },
    { key: 'txn', header: t('txn'), render: (r) => <span dir="ltr" className="font-mono text-xs">{r.txnRef}</span> },
    { key: 'paid', header: t('paidOn'), render: (r) => format.dateTime(new Date(r.paidOn), { dateStyle: 'medium' }) },
    { key: 'sub', header: t('submitted'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' }) },
    { key: 'status', header: t('status'), render: (r) => t(`statuses.${r.status}`) },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => { setReason(''); setFailed(false); setDlg({ row: r, mode: 'VERIFY' }); }} className={actionBtn}>
              {t('verify')}
            </button>
            <button type="button" onClick={() => { setReason(''); setFailed(false); setDlg({ row: r, mode: 'REJECT' }); }} className={dangerBtn}>
              {t('reject')}
            </button>
          </div>
        ) : null,
    },
  ];

  const filters = [
    { key: 'PENDING' as const, label: t('filterPending') },
    { key: 'VERIFIED' as const, label: t('filterVerified') },
    { key: 'REJECTED' as const, label: t('filterRejected') },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={t('empty')}
        loading={loading}
        pagination={{ page, pageSize: 20, total, onPage: setPage }}
      />

      <Dialog
        open={dlg !== null}
        onClose={() => setDlg(null)}
        title={dlg?.mode === 'VERIFY' ? t('verifyTitle') : t('rejectTitle')}
        footer={
          <>
            <button type="button" onClick={() => setDlg(null)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {tcc('cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy || (dlg?.mode === 'REJECT' && reason.trim().length < 5)}
              className={cn('inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60', dlg?.mode === 'REJECT' ? 'bg-[var(--color-rose)]' : 'bg-brand')}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {tcc('confirm')}
            </button>
          </>
        }
      >
        {dlg && (
          <p className="mb-4 text-sm font-medium">
            {dlg.row.centerName} · <span dir="ltr">PKR {dlg.row.amount.toLocaleString('en-US')}</span> · <span dir="ltr">{dlg.row.txnRef}</span>
          </p>
        )}
        {dlg?.mode === 'VERIFY' && <p className="text-sm text-[var(--color-muted)]">{t('verifyBody')}</p>}
        {dlg?.mode === 'REJECT' && (
          <div>
            <label htmlFor="p-reason" className={labelClass}>{t('reason')}</label>
            <textarea id="p-reason" rows={3} className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        {failed && <p role="alert" className="mt-3 text-sm text-[var(--color-rose)]">{tcc('error')}</p>}
      </Dialog>
    </>
  );
}
