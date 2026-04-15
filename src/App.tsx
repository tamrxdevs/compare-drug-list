import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import FilePreview from './components/FilePreview';
import RowMatcher from './components/RowMatcher';
import ColumnMapper from './components/ColumnMapper';
import ComparisonResults from './components/ComparisonResults';
import type { ParsedFile, ColumnMapping, ComparisonResult } from './types';
import { compareCSV } from './utils/compareCSV';
import { buildSmartMappings } from './utils/smartMatch';

type Step = 'upload' | 'map' | 'results';

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload Files' },
    { id: 'map', label: 'Map Columns' },
    { id: 'results', label: 'View Results' },
  ];
  const stepIndex = (s: Step) => steps.findIndex((x) => x.id === s);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = stepIndex(current) > i;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${active ? 'bg-white/20' : done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {done ? '✓' : i + 1}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 rounded-full ${stepIndex(current) > i ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [file1, setFile1] = useState<ParsedFile | null>(null);
  const [file2, setFile2] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [keyColumns, setKeyColumns] = useState<string[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  // Auto-advance to map step when both files uploaded
  useEffect(() => {
    if (file1 && file2 && step === 'upload') {
      setStep('map');
      // Smart word-overlap match; unmatched File 1 columns get file2Column = ''
      const allMappings = buildSmartMappings(file1.headers, file2.headers);
      setMappings(allMappings);
      const firstMapped = allMappings.find((m) => m.file2Column !== '');
      if (firstMapped) setKeyColumns([firstMapped.file1Column]);
    }
  }, [file1, file2]);

  const handleCompare = () => {
    if (!file1 || !file2 || keyColumns.length === 0) return;
    const keyMappings = mappings.filter((m) => keyColumns.includes(m.file1Column));
    const comparison = compareCSV(file1.rows, file2.rows, keyMappings, mappings);
    setResult(comparison);
    setStep('results');
  };

  const handleReset = () => {
    setStep('upload');
    setFile1(null);
    setFile2(null);
    setMappings([]);
    setKeyColumns([]);
    setResult(null);
  };

  const canCompare =
    file1 &&
    file2 &&
    mappings.length > 0 &&
    keyColumns.length > 0 &&
    keyColumns.every((k) => mappings.find((m) => m.file1Column === k)?.file2Column);

  const handleFile1Change = (f: ParsedFile) => {
    setFile1(f);
    setMappings([]);
    setKeyColumns([]);
    setResult(null);
    setStep((s) => (s === 'results' ? 'map' : s));
  };

  const handleFile2Change = (f: ParsedFile) => {
    setFile2(f);
    setMappings([]);
    setKeyColumns([]);
    setResult(null);
    setStep((s) => (s === 'results' ? 'map' : s));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-lg">CSV Comparator</span>
          </div>
          <div className="hidden sm:block">
            <StepIndicator current={step} />
          </div>
          {step !== 'upload' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Step: Upload */}
        {(step === 'upload' || step === 'map') && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Upload CSV Files</h2>
            <p className="text-sm text-slate-500 mb-5">Upload two CSV files to compare. Both files need headers in the first row.</p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <FileUpload
                label="Source File"
                fileNumber={1}
                parsedFile={file1}
                onFileParsed={handleFile1Change}
              />
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <FileUpload
                label="Target File"
                fileNumber={2}
                parsedFile={file2}
                onFileParsed={handleFile2Change}
              />
            </div>
          </div>
        )}

        {/* Step: Map columns */}
        {step === 'map' && file1 && file2 && (
          <>
            <FilePreview file1={file1} file2={file2} />
            <ColumnMapper
              file1Headers={file1.headers}
              file2Headers={file2.headers}
              mappings={mappings}
              keyColumns={keyColumns}
              onMappingsChange={setMappings}
              onKeyColumnsChange={setKeyColumns}
            />

            <RowMatcher
              mappings={mappings}
              keyColumns={keyColumns}
              file1={file1}
              file2={file2}
              onKeyColumnsChange={setKeyColumns}
            />

            <div className="flex justify-end">
              <button
                onClick={handleCompare}
                disabled={!canCompare}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
                  ${canCompare
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Files
              </button>
            </div>
          </>
        )}

        {/* Step: Results */}
        {step === 'results' && result && file1 && file2 && (
          <>
            {/* Allow re-mapping without losing results */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('map')}
                className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Edit Mappings
              </button>
            </div>
            <ComparisonResults
              result={result}
              file1Name={file1.name}
              file2Name={file2.name}
              mappings={mappings}
              keyColumns={keyColumns}
            />
          </>
        )}

        {/* Empty state for upload step */}
        {step === 'upload' && !file1 && !file2 && (
          <div className="text-center py-4 text-slate-400 text-sm">
            Upload both files above to get started.
          </div>
        )}
      </main>
    </div>
  );
}
