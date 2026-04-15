import { useMemo } from 'react';
import type { RowFilter, ParsedFile } from '../types';

interface Props {
  file1: ParsedFile;
  filters: RowFilter[];
  onFiltersChange: (filters: RowFilter[]) => void;
}

export default function RowFilterPanel({ file1, filters, onFiltersChange }: Props) {
  // Unique values per column (capped at 200 for performance)
  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const header of file1.headers) {
      const seen = new Set<string>();
      for (const row of file1.rows) {
        const v = (row[header] ?? '').trim();
        if (v) seen.add(v);
        if (seen.size >= 200) break;
      }
      map[header] = Array.from(seen).sort();
    }
    return map;
  }, [file1]);

  const addFilter = () => {
    const col = file1.headers[0];
    const vals = uniqueValues[col] ?? [];
    onFiltersChange([...filters, { column: col, value: vals[0] ?? '' }]);
  };

  const updateFilter = (index: number, field: 'column' | 'value', val: string) => {
    const updated = filters.map((f, i) => {
      if (i !== index) return f;
      if (field === 'column') {
        // Reset value when column changes
        const newVals = uniqueValues[val] ?? [];
        return { column: val, value: newVals[0] ?? '' };
      }
      return { ...f, value: val };
    });
    onFiltersChange(updated);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  // Count how many rows would be excluded
  const excludedCount = useMemo(() => {
    if (filters.length === 0) return 0;
    return file1.rows.filter((row) =>
      filters.some((f) => (row[f.column] ?? '').trim() === f.value)
    ).length;
  }, [file1.rows, filters]);

  const includedCount = file1.rows.length - excludedCount;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-800">Exclude Rows from File 1</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Exclude rows where a column matches a specific value — e.g. skip all rows where <span className="font-medium text-slate-700">Type = Generic</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Filter rules */}
        {filters.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            No exclusions set — all {file1.rows.length.toLocaleString()} rows from File 1 will be compared.
          </p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                {/* "Exclude rows where" label */}
                <span className="text-xs font-semibold text-rose-500 uppercase tracking-wide whitespace-nowrap">
                  Exclude where
                </span>

                {/* Column selector */}
                <select
                  value={filter.column}
                  onChange={(e) => updateFilter(index, 'column', e.target.value)}
                  className="text-sm border border-rose-200 bg-white rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-0 flex-1"
                >
                  {file1.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>

                <span className="text-xs font-semibold text-slate-500">=</span>

                {/* Value selector — shows unique values from that column */}
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="text-sm border border-rose-200 bg-white rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-0 flex-1"
                >
                  {(uniqueValues[filter.column] ?? []).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                  {(uniqueValues[filter.column] ?? []).length === 0 && (
                    <option value="">— no values —</option>
                  )}
                </select>

                {/* Remove */}
                <button
                  onClick={() => removeFilter(index)}
                  className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center bg-white border border-rose-200 text-rose-400 hover:border-rose-500 hover:text-rose-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addFilter}
          className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add exclusion rule
        </button>

        {/* Summary pill */}
        {filters.length > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-slate-700">{includedCount.toLocaleString()}</span>
              <span className="text-slate-500">rows will be compared</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span className="font-semibold text-slate-700">{excludedCount.toLocaleString()}</span>
              <span className="text-slate-500">rows excluded</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
