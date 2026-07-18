'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  loading = false,
  pagination,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
  pagination?: { page: number; pageSize: number; total: number; onPage: (p: number) => void };
}) {
  const tc = useTranslations('RegistryCommon');
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-base-850)]/80 backdrop-blur">
            <tr className="border-b border-white/10 text-start">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-white/5">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[10rem] animate-pulse rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-white/[0.04]',
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-middle text-[var(--color-fg)]', c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <Inbox className="size-8 text-[var(--color-faint)]" />
          <p className="text-sm text-[var(--color-muted)]">{empty ?? tc('empty')}</p>
        </div>
      )}

      {pagination && pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3">
          <span className="text-xs text-[var(--color-faint)]">
            {tc('page')} {pagination.page} {tc('of')} {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPage(pagination.page - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronLeft className="size-4 rtl:-scale-x-100" />
              {tc('back')}
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPage(pagination.page + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {tc('next')}
              <ChevronRight className="size-4 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
