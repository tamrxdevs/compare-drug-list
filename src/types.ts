export interface ParsedFile {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface RowFilter {
  column: string;
  value: string;
}

export type MatchType = 'exact' | 'startsWith';

export interface ColumnMapping {
  file1Column: string;
  file2Column: string;
  matchType?: MatchType; // default: 'exact'
}

export interface ComparisonResult {
  matched: MatchedRow[];
  onlyInFile1: Record<string, string>[];
  onlyInFile2: Record<string, string>[];
  different: DifferentRow[];
}

export interface MatchedRow {
  file1Row: Record<string, string>;
  file2Row: Record<string, string>;
  keyValues: Record<string, string>;
}

export interface DifferentRow {
  file1Row: Record<string, string>;
  file2Row: Record<string, string>;
  keyValues: Record<string, string>;
  differences: ColumnDiff[];
}

export interface ColumnDiff {
  file1Column: string;
  file2Column: string;
  file1Value: string;
  file2Value: string;
}
