import type { ColumnMapping } from '../types';

interface Props {
  file1Headers: string[];
  file2Headers: string[];
  mappings: ColumnMapping[];
  keyColumns: string[]; // file1 column names used as keys
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  onKeyColumnsChange: (keys: string[]) => void;
}

export default function ColumnMapper({
  file1Headers,
  file2Headers,
  mappings,
  keyColumns,
  onMappingsChange,
  onKeyColumnsChange,
}: Props) {
  const updateMapping = (index: number, field: 'file1Column' | 'file2Column', value: string) => {
    const updated = mappings.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    onMappingsChange(updated);
  };

  const addMapping = () => {
    const usedFile1 = new Set(mappings.map((m) => m.file1Column));
    const usedFile2 = new Set(mappings.map((m) => m.file2Column));
    const nextFile1 = file1Headers.find((h) => !usedFile1.has(h)) ?? '';
    const nextFile2 = file2Headers.find((h) => !usedFile2.has(h)) ?? '';
    onMappingsChange([...mappings, { file1Column: nextFile1, file2Column: nextFile2 }]);
  };

  const removeMapping = (index: number) => {
    const removed = mappings[index].file1Column;
    onMappingsChange(mappings.filter((_, i) => i !== index));
    onKeyColumnsChange(keyColumns.filter((k) => k !== removed));
  };

  const toggleKey = (file1Column: string) => {
    if (keyColumns.includes(file1Column)) {
      onKeyColumnsChange(keyColumns.filter((k) => k !== file1Column));
    } else {
      onKeyColumnsChange([...keyColumns, file1Column]);
    }
  };

  const autoMap = () => {
    const usedFile2 = new Set<string>();
    const newMappings: ColumnMapping[] = file1Headers.map((h1, i) => {
      const exact = file2Headers.find(
        (h2) => !usedFile2.has(h2) && h2.toLowerCase().trim() === h1.toLowerCase().trim()
      );
      const fallback = file2Headers.find((h2) => !usedFile2.has(h2)) ?? file2Headers[0];
      const file2Column = exact ?? (file2Headers[i] && !usedFile2.has(file2Headers[i]) ? file2Headers[i] : fallback);
      usedFile2.add(file2Column);
      return { file1Column: h1, file2Column };
    });
    onMappingsChange(newMappings);
    if (keyColumns.length === 0 && newMappings.length > 0) {
      onKeyColumnsChange([newMappings[0].file1Column]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Column Mapping</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Map columns from File 1 to File 2. Mark key columns <span className="text-amber-600 font-medium">(★)</span> used for row matching.
          </p>
        </div>
        <button
          onClick={autoMap}
          className="flex items-center gap-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Auto-map
        </button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">File 1 Column</span>
        </div>
        <div />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">File 2 Column</span>
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Key</div>
        <div />
      </div>

      <div className="space-y-2">
        {mappings.map((mapping, index) => {
          const isKey = keyColumns.includes(mapping.file1Column);
          return (
            <div
              key={index}
              className={`grid grid-cols-[1fr_auto_1fr_auto_auto] gap-2 items-center p-2 rounded-lg transition-colors
                ${isKey ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-transparent'}`}
            >
              {/* File 1 column select */}
              <select
                value={mapping.file1Column}
                onChange={(e) => updateMapping(index, 'file1Column', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {file1Headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              {/* Arrow */}
              <div className="text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* File 2 column select */}
              <select
                value={mapping.file2Column}
                onChange={(e) => updateMapping(index, 'file2Column', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {file2Headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              {/* Key toggle */}
              <button
                onClick={() => toggleKey(mapping.file1Column)}
                title={isKey ? 'Remove as key column' : 'Set as key column'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-base
                  ${isKey
                    ? 'bg-amber-400 text-white hover:bg-amber-500'
                    : 'bg-white border border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-400'
                  }`}
              >
                ★
              </button>

              {/* Remove */}
              <button
                onClick={() => removeMapping(index)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {mappings.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">
          No column mappings yet. Click <span className="font-medium">Auto-map</span> or add manually.
        </div>
      )}

      <button
        onClick={addMapping}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add mapping
      </button>

      {keyColumns.length === 0 && mappings.length > 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            Mark at least one column as a <strong>Key (★)</strong> to identify matching rows.
          </p>
        </div>
      )}
    </div>
  );
}
