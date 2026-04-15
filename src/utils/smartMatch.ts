/**
 * Tokenizes a column name into lowercase words, splitting on spaces,
 * underscores, hyphens, slashes, and camelCase boundaries.
 * e.g. "DisplayStrength" → ["display", "strength"]
 *      "Sale Price"       → ["sale", "price"]
 */
function tokenize(str: string): Set<string> {
  const tokens = str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → "camel Case"
    .split(/[\s_\-\/]+/)
    .map((w) => w.toLowerCase().trim())
    .filter(Boolean);
  return new Set(tokens);
}

/**
 * Jaccard similarity between two column names based on their word tokens.
 * Returns a score in [0, 1]. Exact match = 1, no overlap = 0.
 */
function score(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => { if (tb.has(t)) shared++; });
  return shared / (ta.size + tb.size - shared); // Jaccard
}

/**
 * Given a list of File 1 headers and File 2 headers, returns the best
 * File 2 match for each File 1 header using smart (word-overlap) scoring.
 *
 * Strategy: score every (f1, f2) pair, then assign from highest score
 * downward so that exact/full-title matches (score = 1.0) are always
 * claimed before lower-confidence partial matches.
 *
 * e.g. "Retail Price" ↔ "Retail Price" (1.0) is assigned before
 *      "Base Price" can steal it via a weaker partial match (0.33).
 *
 * Unmatched headers (score = 0) get file2Column = ''.
 */
export function buildSmartMappings(
  file1Headers: string[],
  file2Headers: string[]
): { file1Column: string; file2Column: string }[] {
  // Build all scored pairs (skip zero-overlap pairs)
  const allPairs: { h1: string; h2: string; s: number }[] = [];
  for (const h1 of file1Headers) {
    for (const h2 of file2Headers) {
      const s = score(h1, h2);
      if (s > 0) allPairs.push({ h1, h2, s });
    }
  }

  // Sort highest score first so best matches are assigned first
  allPairs.sort((a, b) => b.s - a.s);

  const usedFile1 = new Set<string>();
  const usedFile2 = new Set<string>();
  const result = new Map<string, string>(); // file1Column → file2Column

  for (const { h1, h2 } of allPairs) {
    if (!usedFile1.has(h1) && !usedFile2.has(h2)) {
      result.set(h1, h2);
      usedFile1.add(h1);
      usedFile2.add(h2);
    }
  }

  // Return in original File 1 column order; unmatched get ''
  return file1Headers.map((h1) => ({
    file1Column: h1,
    file2Column: result.get(h1) ?? '',
  }));
}
