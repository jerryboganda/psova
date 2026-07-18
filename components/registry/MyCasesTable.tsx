'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { DataTable, type Column } from './DataTable';
import { RegistryBadge } from './RegistryBadge';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';

type Row = {
  id: string;
  trackingCode: string;
  firstName: string;
  conditionSlug: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  createdAt: string;
};

export function MyCasesTable() {
  const t = useTranslations('RegistryClinician');
  const te = useTranslations('RegistryEnroll');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registry/cases?page=${p}`, { cache: 'no-store' });
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
    load(page);
  }, [page, load]);

  const conditionLabel = (slug: string) => {
    if (slug === 'other') return te('conditionOptions.other');
    if (slug === 'not-sure') return te('conditionOptions.notSure');
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug;
  };

  const columns: Column<Row>[] = [
    { key: 'code', header: t('table.code'), render: (r) => <span dir="ltr" className="font-mono text-xs">{r.trackingCode}</span> },
    { key: 'patient', header: t('table.patient'), render: (r) => r.firstName },
    { key: 'condition', header: t('table.condition'), render: (r) => conditionLabel(r.conditionSlug) },
    { key: 'status', header: t('table.status'), render: (r) => <RegistryBadge status={r.status} /> },
    { key: 'date', header: t('table.date'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' }) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={(r) => router.push(`/registry/clinician/${r.id}`)}
      empty={t('empty')}
      loading={loading}
      pagination={{ page, pageSize: 20, total, onPage: setPage }}
    />
  );
}
