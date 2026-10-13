// ─── City Matching, Normalization & Sanitization Utilities ──────────────────

/**
 * Standardize city names: trim, lowercase, unify apostrophes (`'` vs `’` vs `‘`), remove punctuation artifacts.
 */
export function normalizeCityName(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[’`‘]/g, "'")
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize city input query to prevent regex injection and strip invalid characters.
 */
export function sanitizeCityQuery(query: string): string {
  if (!query) return '';
  // Allow Unicode letters, numbers, spaces, hyphens, and apostrophes
  return query
    .replace(/[^\p{L}\p{N}\s\-']/gu, '')
    .replace(/\s+/g, ' ');
}

/**
 * Robust match between a stop/route city name and a search term:
 * Avoids false positives like "Вінниця" matching "Інсбрук".
 * Supports prefix matching, exact matching, or distinct token matching.
 */
export function isCityMatch(stopCity: string, searchCity: string): boolean {
  const normStop = normalizeCityName(stopCity);
  const normSearch = normalizeCityName(searchCity);

  if (!normStop || !normSearch) return false;

  // Exact match
  if (normStop === normSearch) return true;

  // If search query is short (< 3 chars), require startWith
  if (normSearch.length < 3) {
    return normStop.startsWith(normSearch);
  }

  // Token-level check (e.g., "Івано-Франківськ" or "Київ (Центральний)")
  const stopTokens = normStop.split(/[\s\-()/,]+/).filter(Boolean);
  const searchTokens = normSearch.split(/[\s\-()/,]+/).filter(Boolean);

  // Search matches if every search token matches the start or full word of at least one stop token
  const allMatched = searchTokens.every(st =>
    stopTokens.some(stopToken => stopToken.startsWith(st) || stopToken === st)
  );

  if (allMatched) return true;

  // Fallback: stop name starts with search query or search query starts with stop name
  return normStop.startsWith(normSearch) || normSearch.startsWith(normStop);
}

/**
 * Checks whether from and to cities are identical.
 */
export function areCitiesIdentical(from: string, to: string): boolean {
  const nFrom = normalizeCityName(from);
  const nTo = normalizeCityName(to);
  return !!nFrom && !!nTo && nFrom === nTo;
}
