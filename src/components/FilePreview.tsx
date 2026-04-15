import { useState } from 'react';
import type { ParsedFile } from '../types';

interface Props {
  file1: ParsedFile;
  file2: ParsedFile;
}

function MiniTable({ file, color }: { file: ParsedFile; color: 'blue' | 'emerald' }) {
  const previewRows = file.rows.slice(0, 5);
  const ring = color === 'blue' ? 'ring-blue-200' : 'ring-emerald-200';
  const badge = color === 'blue' ? 'bg-blue-600' : 'bg-emerald-600';
  const headBg = color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700';
  const dot = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className={`flex-1 min-w-0 rounded-xl border border-slate-200 ring-1 ${ring} overflow-hidden`}>
      {/* File header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200">
        <span className={`${dot} w-2 h-2 rounded-full flex-shrink-0`} />
        <span className="text-xs font-semibold text-slate-700 truncate flex-1">{file.name}</span>
        <span className={`${badge} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0`}>
          {file.rows.length.toLocaleString()} rows
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {file.headers.map((h) => (
                <th
                  key={h}
                  className={`${headBg} text-left font-semibold px-3 py-2 whitespace-nowrap border-b border-slate-200`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previewRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {file.headers.map((h) => (
                  <td key={h} className="px-3 py-1.5 text-slate-600 whitespace-nowrap max-w-[140px] truncate">
                    {row[h] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {file.rows.length > 5 && (
        <div className="px-3 py-1.5 text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
          Showing 5 of {file.rows.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
}

export default function FilePreview({ file1, file2 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M3 6h18M3 14h18M3 18h18" />
          </svg>
          <span className="font-semibold text-slate-800">Data Preview</span>
          <span className="text-xs text-slate-400 font-normal">first 5 rows of each file</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-6 pb-5 flex flex-col lg:flex-row gap-4 overflow-hidden">
          <MiniTable file={file1} color="blue" />
          <MiniTable file={file2} color="emerald" />
        </div>
      )}
    </div>
  );
}
