'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { DataTable, type Column } from './DataTable';
import { AuditAction } from '@/lib/registry/constants';
import { fieldClass } from './field';

type Row = {
  id: string;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
};

const ACTIONS = Object.values(AuditAction);

export function AdminAudit() {
  const t = useTranslations('RegistryAdmin');
  const tc = useTranslations('RegistryCommon');
  const format = useFormatter();

  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, filters: { action: string; from: string; to: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filters.action) params.set('action', filters.action);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      const res = await fetch(`/api/registry/admin/audit?${params.toString()}`, { cache: 'no-store' });
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
  }, [action, from, to]);
  useEffect(() => {
    load(page, { action, from, to });
  }, [page, action, from, to, load]);

  const columns: Column<Row>[] = [
    { key: 'time', header: t('audit.time'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'short', timeStyle: 'short' }) },
    { key: 'actor', header: t('audit.actor'), render: (r) => r.actorName ?? r.actorEmail ?? '—' },
    { key: 'role', header: t('audit.role'), render: (r) => r.actorRole ?? '—' },
    { key: 'action', header: t('audit.action'), render: (r) => <span className="font-mono text-xs">{r.action}</span> },
    { key: 'entity', header: t('audit.entity'), render: (r) => r.entity },
    { key: 'ip', header: t('audit.ip'), render: (r) => <span dir="ltr" className="text-xs">{r.ip ?? '—'}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <select className={`${fieldClass} w-auto`} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">{t('records.anyStatus')}</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" className={`${fieldClass} w-auto`} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="from" />
        <input type="date" className={`${fieldClass} w-auto`} value={to} onChange={(e) => setTo(e.target.value)} aria-label="to" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={tc('empty')}
        loading={loading}
        pagination={{ page, pageSize: 50, total, onPage: setPage }}
      />
    </div>
  );
}
