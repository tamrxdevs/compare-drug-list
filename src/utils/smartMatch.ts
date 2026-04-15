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
 * Unmatched headers (score = 0) get file2Column = ''.
 * Each File 2 column is used at most once (greedy best-first assignment).
 */
export function buildSmartMappings(
  file1Headers: string[],
  file2Headers: string[]
): { file1Column: string; file2Column: string }[] {
  // Score every (f1, f2) pair
  const scored = file1Headers.map((h1) =>
    file2Headers
      .map((h2) => ({ h1, h2, s: score(h1, h2) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
  );

  const usedFile2 = new Set<string>();

  return file1Headers.map((h1, i) => {
    const candidates = scored[i];
    const best = candidates.find((c) => !usedFile2.has(c.h2));
    if (best) {
      usedFile2.add(best.h2);
      return { file1Column: h1, file2Column: best.h2 };
    }
    return { file1Column: h1, file2Column: '' };
  });
}
