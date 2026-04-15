import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import type { ParsedFile } from '../types';

/**
 * Excel saves long numeric codes (GPI, NDC, etc.) as scientific notation
 * in CSV files, e.g. 30124034000000 → 3.0124034E+13.
 * This converts them back to their full integer string form.
 */
function expandScientific(val: string): string {
  const match = val.trim().match(/^(-?)(\d+)\.?(\d*)[eE]\+(\d+)$/i);
  if (!match) return val;
  const [, sign, intPart, fracPart, expStr] = match;
  const exp = parseInt(expStr, 10);
  const allDigits = intPart + fracPart;
  const shift = exp - fracPart.length;
  if (shift < 0) return val; // has fractional remainder — leave as-is
  return sign + allDigits + '0'.repeat(shift);
}

function expandRows(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.map((row) => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      out[key] = expandScientific(row[key] ?? '');
    }
    return out;
  });
}

interface Props {
  label: string;
  fileNumber: 1 | 2;
  onFileParsed: (file: ParsedFile) => void;
  parsedFile: ParsedFile | null;
}

export default function FileUpload({ label, fileNumber, onFileParsed, parsedFile }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file.');
        return;
      }
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setError('CSV has no headers.');
            return;
          }
          onFileParsed({
            name: file.name,
            headers: results.meta.fields,
            rows: expandRows(results.data),
          });
        },
        error(err) {
          setError(`Parse error: ${err.message}`);
        },
      });
    },
    [onFileParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const colorMap = {
    1: { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-600', icon: 'text-blue-500', hover: 'hover:border-blue-500 hover:bg-blue-100' },
    2: { border: 'border-emerald-400', bg: 'bg-emerald-50', badge: 'bg-emerald-600', icon: 'text-emerald-500', hover: 'hover:border-emerald-500 hover:bg-emerald-100' },
  };
  const colors = colorMap[fileNumber];

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`${colors.badge} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
          File {fileNumber}
        </span>
        <span className="font-semibold text-slate-700">{label}</span>
      </div>

      <label
        className={`block border-2 border-dashed rounded-xl cursor-pointer transition-all
          ${isDragging ? `${colors.border} ${colors.bg} scale-[1.01]` : `border-slate-300 bg-white ${colors.hover}`}
          ${parsedFile ? `${colors.border} ${colors.bg}` : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".csv" className="sr-only" onChange={handleChange} />

        {parsedFile ? (
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{parsedFile.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {parsedFile.rows.length.toLocaleString()} rows &bull; {parsedFile.headers.length} columns
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {parsedFile.headers.slice(0, 6).map((h) => (
                    <span key={h} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                      {h}
                    </span>
                  ))}
                  {parsedFile.headers.length > 6 && (
                    <span className="text-xs text-slate-400 px-1">+{parsedFile.headers.length - 6} more</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">Click or drop to replace</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-xl border-2 ${colors.border} ${colors.bg} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700">Drop CSV here or <span className={`${colors.icon.replace('text-', 'text-')} underline`}>browse</span></p>
              <p className="text-sm text-slate-400 mt-1">Only .csv files supported</p>
            </div>
          </div>
        )}
      </label>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
