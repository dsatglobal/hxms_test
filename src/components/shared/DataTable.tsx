/**
 * Reusable data table — sticky header, sortable columns, row click,
 * actions column with stopPropagation, pagination, empty state.
 */
import React, { useState, useMemo, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

export interface DataTableColumn<Row = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  /** Value used for sorting; if omitted the column is not sortable */
  sortValue?: (row: Row) => string | number;
  render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row = any> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  onRowClick: (row: Row) => void;
  rowActions?: (row: Row) => ReactNode;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    action?: ReactNode;
  };
  pageSize?: number;
  /** Stable row key, defaults to row.id */
  rowKey?: (row: Row) => string;
}

const alignClass = (a?: 'left' | 'right' | 'center') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

function DataTable<Row = any>({
  columns, rows, onRowClick, rowActions, emptyState, pageSize = 20, rowKey,
}: DataTableProps<Row>) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = sv(a), vb = sv(b);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (rows.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        {emptyState.icon && <div className="mb-3 text-slate-300">{emptyState.icon}</div>}
        <div className="text-sm font-semibold text-slate-600">{emptyState.title}</div>
        {emptyState.subtitle && <div className="text-xs text-slate-400 mt-1">{emptyState.subtitle}</div>}
        {emptyState.action && <div className="mt-4">{emptyState.action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortValue ? () => toggleSort(col.key) : undefined}
                  className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${alignClass(col.align)} ${col.sortValue ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (sortDir === 'asc'
                      ? <ArrowUp className="w-3 h-3 text-blue-500" />
                      : <ArrowDown className="w-3 h-3 text-blue-500" />)}
                  </span>
                </th>
              ))}
              {rowActions && <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right w-px whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : (row as any).id ?? i}
                onClick={() => onRowClick(row)}
                className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition h-[52px]"
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-2 ${alignClass(col.align)}`}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-white">
          <span className="text-xs text-slate-500">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, p) => p)
              .filter(p => p === 0 || p === totalPages - 1 || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-slate-300 px-0.5">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`h-7 min-w-7 px-1.5 rounded text-xs font-medium ${p === safePage ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {p + 1}
                  </button>
                </React.Fragment>
              ))}
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
