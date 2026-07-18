'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Search, Download, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { DataTable, type Column } from './DataTable';
import { RegistryBadge } from './RegistryBadge';
import { Dialog } from './Dialog';
import { REGISTRY_STATUSES, PROVINCES, RECORD_SOURCES } from '@/lib/registry/constants';
import { CONDITIONS } from '@/data/conditions';
import { localized } from '@/lib/utils';
import { fieldClass } from './field';

type Row = {
  id: string;
  trackingCode: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
  source: string;
  province: string;
  district: string;
  gender: string;
  birthYear: number;
  conditionSlug: string;
  possibleDuplicate: boolean;
  createdAt: string;
};

export function AdminRecordsBrowser({ queue = false }: { queue?: boolean }) {
  const t = useTranslations('RegistryAdmin');
  const tc = useTranslations('RegistryCommon');
  const te = useTranslations('RegistryEnroll');
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();

  const [status, setStatus] = useState('');
  const [province, setProvince] = useState('');
  const [conditionSlug, setConditionSlug] = useState('');
  const [source, setSource] = useState('');
  const [dupOnly, setDupOnly] = useState(false);
  const [qType, setQType] = useState<'code' | 'cnic' | 'phone'>('code');
  const [qInput, setQInput] = useState('');
  const [applied, setApplied] = useState<{ q: string; qType: string } | null>(null);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const buildBody = useCallback(
    (p: number) => {
      const body: Record<string, string | number> = { page: p };
      if (queue) {
        body.status = 'PENDING';
        body.order = 'asc';
      } else if (status) {
        body.status = status;
      }
      if (province) body.province = province;
      if (conditionSlug) body.conditionSlug = conditionSlug;
      if (source) body.source = source;
      if (dupOnly) body.possibleDuplicate = 'true';
      if (!queue && applied?.q) {
        body.q = applied.q;
        body.qType = applied.qType;
      }
      return body;
    },
    [queue, status, province, conditionSlug, source, dupOnly, applied],
  );

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        // POST so any CNIC/phone lookup value travels in the body, never the URL.
        const res = await fetch('/api/registry/admin/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(p)),
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (data?.ok) {
          setRows(data.items as Row[]);
          setTotal(data.total as number);
        }
      } finally {
        setLoading(false);
      }
    },
    [buildBody],
  );

  useEffect(() => {
    setPage(1);
  }, [status, province, conditionSlug, source, dupOnly, applied]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const conditionName = (slug: string) => {
    if (slug === 'other') return te('conditionOptions.other');
    if (slug === 'not-sure') return te('conditionOptions.notSure');
    const c = CONDITIONS.find((x) => x.slug === slug);
    return c ? localized(c.name, locale) : slug;
  };

  const columns: Column<Row>[] = [
    { key: 'code', header: t('table.code'), render: (r) => <span dir="ltr" className="font-mono text-xs">{r.trackingCode}</span> },
    { key: 'status', header: t('table.status'), render: (r) => <RegistryBadge status={r.status} /> },
    { key: 'source', header: t('table.source'), render: (r) => tc(`sources.${r.source}`) },
    { key: 'province', header: t('table.province'), render: (r) => tc(`provinces.${r.province}`) },
    { key: 'district', header: t('table.district'), render: (r) => r.district },
    { key: 'condition', header: t('table.condition'), render: (r) => conditionName(r.conditionSlug) },
    { key: 'dup', header: t('table.dup'), render: (r) => (r.possibleDuplicate ? '⚠︎' : '') },
    { key: 'date', header: t('table.date'), render: (r) => format.dateTime(new Date(r.createdAt), { dateStyle: 'medium' }) },
  ];

  function exportUrl() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (province) params.set('province', province);
    if (conditionSlug) params.set('conditionSlug', conditionSlug);
    return `/api/registry/admin/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* filters */}
      <div className="flex flex-wrap items-end gap-3">
        {!queue && (
          <select className={`${fieldClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('records.anyStatus')}</option>
            {REGISTRY_STATUSES.map((s) => <option key={s} value={s}>{tc(`statuses.${s}`)}</option>)}
          </select>
        )}
        <select className={`${fieldClass} w-auto`} value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">{t('records.anyProvince')}</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{tc(`provinces.${p}`)}</option>)}
        </select>
        <select className={`${fieldClass} w-auto`} value={conditionSlug} onChange={(e) => setConditionSlug(e.target.value)}>
          <option value="">{t('records.anyCondition')}</option>
          {CONDITIONS.map((c) => <option key={c.slug} value={c.slug}>{localized(c.name, locale)}</option>)}
          <option value="other">{te('conditionOptions.other')}</option>
          <option value="not-sure">{te('conditionOptions.notSure')}</option>
        </select>
        <select className={`${fieldClass} w-auto`} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{t('records.anySource')}</option>
          {RECORD_SOURCES.map((s) => <option key={s} value={s}>{tc(`sources.${s}`)}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <input type="checkbox" checked={dupOnly} onChange={(e) => setDupOnly(e.target.checked)} className="size-4 accent-[var(--color-cyan)]" />
          {t('records.dupOnly')}
        </label>
      </div>

      {!queue && (
        <div className="flex flex-wrap items-end gap-2">
          <select className={`${fieldClass} w-auto`} value={qType} onChange={(e) => setQType(e.target.value as 'code' | 'cnic' | 'phone')}>
            <option value="code">{t('records.searchType.code')}</option>
            <option value="cnic">{t('records.searchType.cnic')}</option>
            <option value="phone">{t('records.searchType.phone')}</option>
          </select>
          <input
            dir="ltr"
            className={`${fieldClass} w-auto min-w-[12rem]`}
            placeholder={t('records.searchPlaceholder')}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setApplied({ q: qInput.trim(), qType })}
          />
          <button
            type="button"
            onClick={() => setApplied({ q: qInput.trim(), qType })}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Search className="size-4" />
            {t('records.search')}
          </button>
          {applied?.q && (
            <button
              type="button"
              onClick={() => { setQInput(''); setApplied(null); }}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
            >
              <X className="size-4" />
              {t('records.clear')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] hover:bg-white/10"
          >
            <Download className="size-4" />
            {t('export.button')}
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/registry/admin/records/${r.id}`)}
        empty={queue ? t('queue.empty') : tc('empty')}
        loading={loading}
        pagination={{ page, pageSize: 20, total, onPage: setPage }}
      />

      <Dialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={t('export.confirmTitle')}
        footer={
          <>
            <button type="button" onClick={() => setExportOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[var(--color-fg)]">
              {t('export.cancel')}
            </button>
            <a
              href={exportUrl()}
              onClick={() => setExportOpen(false)}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Download className="size-4" />
              {t('export.confirm')}
            </a>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted)]">{t('export.confirmBody')}</p>
      </Dialog>
    </div>
  );
}
