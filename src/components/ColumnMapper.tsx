import type { ColumnMapping } from '../types';
import { buildSmartMappings } from '../utils/smartMatch';

interface Props {
  file1Headers: string[];
  file2Headers: string[];
  mappings: ColumnMapping[];
  keyColumns: string[];
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
  const updateMapping = (index: number, value: string) => {
    const updated = mappings.map((m, i) => (i === index ? { ...m, file2Column: value } : m));
    onMappingsChange(updated);
  };

  const addMapping = () => {
    const usedFile1 = new Set(mappings.map((m) => m.file1Column));
    const nextFile1 = file1Headers.find((h) => !usedFile1.has(h)) ?? file1Headers[0];
    onMappingsChange([...mappings, { file1Column: nextFile1, file2Column: '' }]);
  };

  const removeMapping = (index: number) => {
    const removed = mappings[index].file1Column;
    onMappingsChange(mappings.filter((_, i) => i !== index));
    onKeyColumnsChange(keyColumns.filter((k) => k !== removed));
  };

  const autoMap = () => {
    const newMappings = buildSmartMappings(file1Headers, file2Headers);
    onMappingsChange(newMappings);
    if (keyColumns.length === 0) {
      const firstMapped = newMappings.find((m) => m.file2Column !== '');
      if (firstMapped) onKeyColumnsChange([firstMapped.file1Column]);
    }
  };

  const unmappedCount = mappings.filter((m) => m.file2Column === '').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Column Mapping</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Map each File 1 column to its equivalent in File 2.
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
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">File 1 Column</span>
        </div>
        <div />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">File 2 Column</span>
        </div>
        <div />
      </div>

      <div className="space-y-2">
        {mappings.map((mapping, index) => {
          const isUnmapped = mapping.file2Column === '';
          return (
            <div
              key={index}
              className={`grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center p-2 rounded-lg border transition-colors
                ${isUnmapped ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-transparent'}`}
            >
              {/* File 1 column label */}
              <span className="text-sm font-medium text-slate-800 px-3 py-2 bg-white border border-slate-200 rounded-lg truncate">
                {mapping.file1Column}
              </span>

              {/* Arrow */}
              <div className={isUnmapped ? 'text-orange-400' : 'text-slate-400'}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* File 2 column select */}
              <select
                value={mapping.file2Column}
                onChange={(e) => updateMapping(index, e.target.value)}
                className={`w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2
                  ${isUnmapped
                    ? 'border-orange-300 text-orange-600 focus:ring-orange-400'
                    : 'border-slate-200 text-slate-800 focus:ring-emerald-400'}`}
              >
                <option value="" disabled>— Select column —</option>
                {file2Headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

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

      {unmappedCount > 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-orange-700">
            <strong>{unmappedCount} column{unmappedCount > 1 ? 's' : ''}</strong> not yet mapped — select a File 2 column or remove them.
          </p>
        </div>
      )}
    </div>
  );
}
