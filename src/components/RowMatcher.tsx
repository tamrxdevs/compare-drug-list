import type { ColumnMapping, ParsedFile } from '../types';

interface Props {
  mappings: ColumnMapping[];
  keyColumns: string[];
  file1: ParsedFile;
  file2: ParsedFile;
  onKeyColumnsChange: (keys: string[]) => void;
}

const PREVIEW_COUNT = 6;

export default function RowMatcher({ mappings, keyColumns, file1, file2, onKeyColumnsChange }: Props) {
  const activeMappings = mappings.filter((m) => m.file2Column !== '');

  const toggleKey = (col: string) => {
    onKeyColumnsChange(
      keyColumns.includes(col) ? keyColumns.filter((k) => k !== col) : [...keyColumns, col]
    );
  };

  // Build composite key string for a row given selected key mappings
  const makeKey = (row: Record<string, string>, cols: string[]) =>
    cols.map((c) => (row[c] ?? '').trim().toLowerCase()).join(' | ');

  // Sample preview rows
  const keyMappings = activeMappings.filter((m) => keyColumns.includes(m.file1Column));
  const f1KeyCols = keyMappings.map((m) => m.file1Column);
  const f2KeyCols = keyMappings.map((m) => m.file2Column);

  const f2KeySet = new Set(file2.rows.map((r) => makeKey(r, f2KeyCols)));

  const previewRows = file1.rows.slice(0, PREVIEW_COUNT).map((r) => {
    const keyVal = f1KeyCols.map((c) => r[c] ?? '—').join(' + ');
    const lookupKey = makeKey(r, f1KeyCols);
    const matched = keyColumns.length > 0 && f2KeySet.has(lookupKey);
    return { keyVal, matched };
  });

  const totalMatched = keyColumns.length > 0
    ? file1.rows.filter((r) => f2KeySet.has(makeKey(r, f1KeyCols))).length
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Row Matching</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Choose which column(s) act as a unique ID to pair rows between the two files.
              Rows with the same value(s) in these columns will be compared.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col lg:flex-row gap-6">
        {/* Left: column selector */}
        <div className="lg:w-64 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Select identifier column(s)
          </p>

          {activeMappings.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No mapped columns yet.</p>
          ) : (
            <div className="space-y-1.5">
              {activeMappings.map((m) => {
                const active = keyColumns.includes(m.file1Column);
                return (
                  <button
                    key={m.file1Column}
                    onClick={() => toggleKey(m.file1Column)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all
                      ${active
                        ? 'bg-violet-50 border-violet-300 text-violet-800 font-medium shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/50'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors
                      ${active ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300'}`}>
                      {active && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{m.file1Column}</span>
                    {m.file1Column !== m.file2Column && (
                      <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">→ {m.file2Column}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live preview</p>
            {totalMatched !== null && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalMatched.toLocaleString()} / {file1.rows.length.toLocaleString()} rows matched
              </span>
            )}
          </div>

          {keyColumns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-sm text-slate-400">Select a column on the left to see how rows will be paired</p>
            </div>
          ) : (
            <div className="space-y-0 rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-0 bg-slate-50 border-b border-slate-200">
                <div className="px-3 py-2 text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  File 1 — {f1KeyCols.join(' + ')}
                </div>
                <div className="w-8" />
                <div className="px-3 py-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  File 2 — {f2KeyCols.join(' + ')}
                </div>
                <div className="w-16 px-2 py-2 text-xs font-semibold text-slate-500 text-center">Status</div>
              </div>

              {/* Rows */}
              {previewRows.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_auto_1fr_auto] gap-0 items-center border-b border-slate-100 last:border-0
                    ${row.matched ? 'bg-white' : 'bg-red-50/50'}`}
                >
                  {/* File 1 value */}
                  <div className="px-3 py-2.5 text-sm text-slate-700 font-medium truncate">
                    {row.keyVal}
                  </div>

                  {/* Connector arrow */}
                  <div className="w-8 flex items-center justify-center">
                    {row.matched ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </div>

                  {/* File 2 value */}
                  <div className="px-3 py-2.5 text-sm truncate">
                    {row.matched
                      ? <span className="text-emerald-700 font-medium">{row.keyVal}</span>
                      : <span className="text-red-400 italic">No match found</span>
                    }
                  </div>

                  {/* Status badge */}
                  <div className="w-16 px-2 flex items-center justify-center">
                    {row.matched
                      ? <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Paired</span>
                      : <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Only F1</span>
                    }
                  </div>
                </div>
              ))}

              {file1.rows.length > PREVIEW_COUNT && (
                <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 text-center">
                  Showing first {PREVIEW_COUNT} rows of {file1.rows.length.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
