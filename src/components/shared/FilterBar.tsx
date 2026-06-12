/**
 * Reusable filter bar — search, status pills, dropdown filters,
 * date range with quick presets, and a clear-all button.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, X, ChevronDown } from 'lucide-react';

export interface DropdownFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export interface FilterBarProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;

  statusOptions?: { value: string; label: string; count: number }[];
  activeStatus?: string;
  onStatusChange?: (v: string) => void;

  dropdownFilters?: DropdownFilter[];

  dateRange?: { from: string; to: string };
  onDateRangeChange?: (range: { from: string; to: string }) => void;
  dateRangeLabel?: string;

  onClearAll: () => void;
  activeFilterCount: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

const PRESETS: { label: string; range: () => { from: string; to: string } }[] = [
  { label: 'Today', range: () => { const t = iso(new Date()); return { from: t, to: t }; } },
  { label: 'Last 7 days', range: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { from: iso(s), to: iso(e) }; } },
  { label: 'This Month', range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(new Date(n.getFullYear(), n.getMonth() + 1, 0)) }; } },
  { label: 'Last Month', range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: iso(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
  { label: 'This Quarter', range: () => { const n = new Date(); const q = Math.floor(n.getMonth() / 3) * 3; return { from: iso(new Date(n.getFullYear(), q, 1)), to: iso(new Date(n.getFullYear(), q + 3, 0)) }; } },
];

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder, searchValue, onSearchChange,
  statusOptions, activeStatus, onStatusChange,
  dropdownFilters,
  dateRange, onDateRangeChange, dateRangeLabel,
  onClearAll, activeFilterCount,
}) => {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!presetsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) setPresetsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [presetsOpen]);

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative" style={{ width: 260 }}>
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full h-8 pl-8 pr-2.5 rounded-md border text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${searchValue ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200'}`}
        />
      </div>

      {/* Status pills */}
      {statusOptions && onStatusChange && (
        <div className="flex items-center gap-1 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              className={`h-8 px-2.5 rounded-md text-sm font-medium transition whitespace-nowrap ${
                activeStatus === s.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}{s.count > 0 && <span className={`ml-1 text-xs ${activeStatus === s.value ? 'text-blue-100' : 'text-slate-400'}`}>{s.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown filters */}
      {dropdownFilters?.map(f => (
        <select
          key={f.key}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          className={`h-8 px-2 pr-7 rounded-md border text-sm outline-none cursor-pointer transition focus:border-blue-400 ${f.value ? 'border-blue-300 bg-blue-50/40 text-blue-800' : 'border-slate-200 text-slate-600 bg-white'}`}
        >
          <option value="">{f.label}: All</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}

      {/* Date range */}
      {dateRange && onDateRangeChange && (
        <div className={`flex items-center h-8 rounded-md border text-sm overflow-visible relative ${dateRange.from || dateRange.to ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'}`} ref={presetRef}>
          <button
            onClick={() => setPresetsOpen(o => !o)}
            className="h-full px-2 flex items-center gap-1 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border-r border-slate-200"
            title={dateRangeLabel ? `${dateRangeLabel} date presets` : 'Date presets'}
          >
            <Calendar className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {dateRangeLabel && <span className="px-1.5 text-xs text-slate-400 whitespace-nowrap">{dateRangeLabel}</span>}
          <input
            type="date"
            value={dateRange.from}
            onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value })}
            className="h-full px-1.5 text-xs bg-transparent outline-none text-slate-700 w-[118px]"
          />
          <span className="text-slate-300 px-0.5">→</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value })}
            className="h-full px-1.5 text-xs bg-transparent outline-none text-slate-700 w-[118px]"
          />
          {presetsOpen && (
            <div className="absolute top-9 left-0 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-40">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { onDateRangeChange(p.range()); setPresetsOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => { onDateRangeChange({ from: '', to: '' }); setPresetsOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 border-t border-slate-100"
              >
                Custom / Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="h-8 px-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
        </button>
      )}
    </div>
  );
};

export default FilterBar;
