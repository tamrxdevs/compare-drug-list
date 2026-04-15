import { useState } from 'react';
import type { ColumnMapping, ComparisonResult } from '../types';

interface Props {
  result: ComparisonResult;
  file1Name: string;
  file2Name: string;
  mappings: ColumnMapping[];
  keyColumns: string[];
}

type Tab = 'matched' | 'different' | 'onlyFile1' | 'onlyFile2';

function exportCSV(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RowTable({ rows, headers, emptyMsg }: { rows: Record<string, string>[]; headers: string[]; emptyMsg: string }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  if (rows.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">{emptyMsg}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                    {row[h] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >← Prev</button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DifferentTable({
  result,
  keyColumns,
}: {
  result: ComparisonResult;
  keyColumns: string[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const rows = result.different;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  if (rows.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">No different rows found.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {keyColumns.map((k) => (
                <th key={k} className="text-left text-xs font-semibold text-amber-600 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap">
                  {k} (key)
                </th>
              ))}
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5">Changed Columns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {keyColumns.map((k) => (
                  <td key={k} className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">{row.keyValues[k] ?? ''}</td>
                ))}
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.differences.map((diff, di) => (
                      <div key={di} className="text-xs bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 border-b border-slate-200">
                          {diff.file1Column} → {diff.file2Column !== diff.file1Column ? diff.file2Column : diff.file1Column}
                        </div>
                        <div className="flex divide-x divide-slate-200">
                          <div className="px-2.5 py-1.5 flex-1">
                            <p className="text-[10px] font-semibold text-blue-500 uppercase mb-0.5">File 1</p>
                            <p className="text-red-600 font-medium break-all">{diff.file1Value || <span className="italic text-slate-400">empty</span>}</p>
                          </div>
                          <div className="px-2.5 py-1.5 flex-1">
                            <p className="text-[10px] font-semibold text-emerald-500 uppercase mb-0.5">File 2</p>
                            <p className="text-emerald-700 font-medium break-all">{diff.file2Value || <span className="italic text-slate-400">empty</span>}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparisonResults({ result, file1Name, file2Name, mappings, keyColumns }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('different');

  const tabs: { id: Tab; label: string; count: number; color: string; activeColor: string }[] = [
    { id: 'matched', label: 'Matched', count: result.matched.length, color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white' },
    { id: 'different', label: 'Different', count: result.different.length, color: 'text-orange-600', activeColor: 'bg-orange-500 text-white' },
    { id: 'onlyFile1', label: `Only in File 1`, count: result.onlyInFile1.length, color: 'text-blue-600', activeColor: 'bg-blue-600 text-white' },
    { id: 'onlyFile2', label: `Only in File 2`, count: result.onlyInFile2.length, color: 'text-purple-600', activeColor: 'bg-purple-600 text-white' },
  ];

  const file1Headers = mappings.map((m) => m.file1Column);
  const file2Headers = mappings.map((m) => m.file2Column);

  const handleExport = () => {
    if (activeTab === 'matched') exportCSV(result.matched.map((r) => r.file1Row), 'matched.csv');
    if (activeTab === 'onlyFile1') exportCSV(result.onlyInFile1, 'only_in_file1.csv');
    if (activeTab === 'onlyFile2') exportCSV(result.onlyInFile2, 'only_in_file2.csv');
    if (activeTab === 'different') {
      const rows = result.different.map((r) => {
        const out: Record<string, string> = {};
        keyColumns.forEach((k) => { out[`key_${k}`] = r.keyValues[k] ?? ''; });
        r.differences.forEach((d) => {
          out[`file1_${d.file1Column}`] = d.file1Value;
          out[`file2_${d.file2Column}`] = d.file2Value;
        });
        return out;
      });
      exportCSV(rows, 'different.csv');
    }
  };

  const total = result.matched.length + result.different.length + result.onlyInFile1.length + result.onlyInFile2.length;
  const matchPct = total > 0 ? Math.round((result.matched.length / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Summary bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Comparison Results</h2>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-blue-300 font-medium">{file1Name}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-emerald-300 font-medium">{file2Name}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {tabs.map((tab) => (
            <div key={tab.id} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{tab.count.toLocaleString()}</div>
              <div className="text-xs text-slate-300 mt-0.5">{tab.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span>Match rate</span>
            <span>{matchPct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${matchPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 px-5 flex items-center justify-between">
        <div className="flex gap-1 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id ? tab.activeColor : `${tab.color} hover:bg-slate-100`}`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'matched' && (
          <RowTable
            rows={result.matched.map((r) => r.file1Row)}
            headers={file1Headers}
            emptyMsg="No matched rows found."
          />
        )}
        {activeTab === 'different' && (
          <DifferentTable result={result} keyColumns={keyColumns} />
        )}
        {activeTab === 'onlyFile1' && (
          <RowTable
            rows={result.onlyInFile1}
            headers={file1Headers}
            emptyMsg={`No rows found only in ${file1Name}.`}
          />
        )}
        {activeTab === 'onlyFile2' && (
          <RowTable
            rows={result.onlyInFile2}
            headers={file2Headers}
            emptyMsg={`No rows found only in ${file2Name}.`}
          />
        )}
      </div>
    </div>
  );
}
