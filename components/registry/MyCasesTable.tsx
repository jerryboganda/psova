'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { RotateCcw } from 'lucide-react';
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
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/registry/cases?page=${p}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error();
      setRows(data.items as Row[]);
      setTotal(data.total as number);
    } catch {
      setError(true);
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

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-2xl)] border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/5 px-4 py-12 text-center">
        <p className="text-sm text-[var(--color-rose)]">{t('loadError')}</p>
        <button type="button" onClick={() => load(page)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium">
          <RotateCcw className="size-4" /> {t('retry')}
        </button>
      </div>
    );
  }

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
