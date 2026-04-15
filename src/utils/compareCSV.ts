import type { ColumnMapping, ComparisonResult, DifferentRow, MatchedRow, MatchType } from '../types';

/** Normalize a value for comparison: lowercase, trim, collapse whitespace.
 *  Strips currency symbols and thousand-separator commas so that
 *  "$1,767.48" and "1767.48" are treated as equal.
 *  Values with leading zeros (GPI, NDC, product codes) are NOT converted
 *  through Number() — that would silently destroy the leading zeros.
 */
function normalize(val: string): string {
  const base = val.trim().toLowerCase().replace(/\s+/g, ' ');

  // Strip leading/trailing currency symbols, remove thousand-separator commas
  const stripped = base
    .replace(/^[\s$£€¥₩₹฿\+]+/, '')   // leading currency / sign chars
    .replace(/[\s$£€¥₩₹฿]+$/, '')     // trailing currency chars
    .replace(/,/g, '');                // thousand separators

  // Skip Number() conversion for values with leading zeros (codes/identifiers)
  // or values longer than 15 digits (beyond JS float precision).
  const looksNumeric = stripped !== '' && !isNaN(Number(stripped));
  const hasLeadingZero = stripped.startsWith('0') && stripped.length > 1;
  const tooLongForFloat = stripped.replace('.', '').length > 15;

  if (looksNumeric && !hasLeadingZero && !tooLongForFloat) {
    return String(Number(stripped));
  }

  return stripped || base;
}

/** Returns true if two values should be considered equal given a match type. */
function valuesMatch(a: string, b: string, matchType: MatchType): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (matchType === 'startsWith') {
    // Consider a match if the shorter value is a prefix of the longer one.
    // e.g. Drug Name "Abilify..." matches Variant Name "Abilify... Tablet Pack 2mg"
    return na === nb || na.startsWith(nb) || nb.startsWith(na);
  }
  return na === nb;
}

export function compareCSV(
  file1Rows: Record<string, string>[],
  file2Rows: Record<string, string>[],
  keyMappings: ColumnMapping[],
  allMappings: ColumnMapping[]
): ComparisonResult {
  // Only use mappings where a File 2 column has been selected
  const activeMappings = allMappings.filter((m) => m.file2Column !== '');
  const activeKeyMappings = keyMappings.filter((m) => m.file2Column !== '');

  const matched: MatchedRow[] = [];
  const different: DifferentRow[] = [];
  const onlyInFile1: Record<string, string>[] = [];
  const matchedFile2Indices = new Set<number>();

  for (const f1Row of file1Rows) {
    // Build composite key from file1 row
    const f1Key = activeKeyMappings.map((m) => normalize(f1Row[m.file1Column] ?? '')).join('|||');

    // Find matching row in file2
    const f2Index = file2Rows.findIndex((f2Row, idx) => {
      if (matchedFile2Indices.has(idx)) return false;
      const f2Key = activeKeyMappings.map((m) => normalize(f2Row[m.file2Column] ?? '')).join('|||');
      return f1Key === f2Key;
    });

    if (f2Index === -1) {
      onlyInFile1.push(f1Row);
      continue;
    }

    matchedFile2Indices.add(f2Index);
    const f2Row = file2Rows[f2Index];
    const keyValues: Record<string, string> = {};
    activeKeyMappings.forEach((m) => {
      keyValues[m.file1Column] = f1Row[m.file1Column] ?? '';
    });

    // Check for differences across all active mapped columns
    const differences = activeMappings
      .filter((m) => !activeKeyMappings.some((km) => km.file1Column === m.file1Column))
      .filter((m) => !valuesMatch(
        f1Row[m.file1Column] ?? '',
        f2Row[m.file2Column] ?? '',
        m.matchType ?? 'exact'
      ))
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
