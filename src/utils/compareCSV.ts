import type { ColumnMapping, ComparisonResult, DifferentRow, MatchedRow } from '../types';

export function compareCSV(
  file1Rows: Record<string, string>[],
  file2Rows: Record<string, string>[],
  keyMappings: ColumnMapping[],
  allMappings: ColumnMapping[]
): ComparisonResult {
  const matched: MatchedRow[] = [];
  const different: DifferentRow[] = [];
  const onlyInFile1: Record<string, string>[] = [];
  const matchedFile2Indices = new Set<number>();

  for (const f1Row of file1Rows) {
    // Build composite key from file1 row
    const f1Key = keyMappings.map((m) => (f1Row[m.file1Column] ?? '').trim().toLowerCase()).join('|||');

    // Find matching row in file2
    const f2Index = file2Rows.findIndex((f2Row, idx) => {
      if (matchedFile2Indices.has(idx)) return false;
      const f2Key = keyMappings.map((m) => (f2Row[m.file2Column] ?? '').trim().toLowerCase()).join('|||');
      return f1Key === f2Key;
    });

    if (f2Index === -1) {
      onlyInFile1.push(f1Row);
      continue;
    }

    matchedFile2Indices.add(f2Index);
    const f2Row = file2Rows[f2Index];
    const keyValues: Record<string, string> = {};
    keyMappings.forEach((m) => {
      keyValues[m.file1Column] = f1Row[m.file1Column] ?? '';
    });

    // Check for differences across all mapped columns
    const differences = allMappings
      .filter((m) => !keyMappings.some((km) => km.file1Column === m.file1Column))
      .filter((m) => {
        const v1 = (f1Row[m.file1Column] ?? '').trim();
        const v2 = (f2Row[m.file2Column] ?? '').trim();
        return v1 !== v2;
      })
      .map((m) => ({
        file1Column: m.file1Column,
        file2Column: m.file2Column,
        file1Value: f1Row[m.file1Column] ?? '',
        file2Value: f2Row[m.file2Column] ?? '',
      }));

    if (differences.length === 0) {
      matched.push({ file1Row: f1Row, file2Row: f2Row, keyValues });
    } else {
      different.push({ file1Row: f1Row, file2Row: f2Row, keyValues, differences } as DifferentRow);
    }
  }

  const onlyInFile2 = file2Rows.filter((_, idx) => !matchedFile2Indices.has(idx));

  return { matched, different, onlyInFile1, onlyInFile2 };
}
