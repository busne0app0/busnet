// ─── Date and Calendar Utilities ──────────────────────────────────────────

export const UA_DAYS = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] as const;

export const MONTH_NAMES: Record<string, { nominative: string[]; genitive: string[] }> = {
  uk: {
    nominative: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
    genitive: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
  },
  en: {
    nominative: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    genitive: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  it: {
    nominative: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
    genitive: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  },
  pl: {
    nominative: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
    genitive: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
  },
  de: {
    nominative: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    genitive: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  },
};

export const WEEKDAYS_SHORT: Record<string, string[]> = {
  uk: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'],
  en: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  it: ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'],
  pl: ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'],
  de: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
};

/**
 * Safely parse YYYY-MM-DD into year, month (1-12), day numbers without timezone shift.
 */
export function parseISODateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parts = trimmed.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Format year, month (1-12), day into YYYY-MM-DD.
 */
export function formatISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Add or subtract days from an ISO date string (YYYY-MM-DD) without timezone drift.
 */
export function addDays(dateStr: string, days: number): string {
  const parts = parseISODateParts(dateStr);
  if (!parts) return dateStr;
  const d = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  d.setDate(d.getDate() + days);
  return formatISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Get Ukrainian day of week string ('ПН', 'ВТ', ...) from YYYY-MM-DD without UTC timezone drift.
 */
export function getUaDayOfWeek(dateString: string): string {
  const parts = parseISODateParts(dateString);
  if (!parts) return '';
  // Construct date at noon local time to completely avoid midnight daylight savings or timezone jumps
  const d = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  return UA_DAYS[d.getDay()];
}

/**
 * Check if YYYY-MM-DD is strictly before today (local midnight).
 */
export function isPastDate(dateString: string): boolean {
  const parts = parseISODateParts(dateString);
  if (!parts) return false;
  const target = new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

/**
 * Format a YYYY-MM-DD string for display according to the selected app language.
 */
export function formatLocalizedDate(dateString: string, language: string = 'uk'): string {
  if (!dateString) return '';
  const parts = parseISODateParts(dateString);
  if (!parts) return dateString;

  const localeMap: Record<string, string> = {
    uk: 'uk-UA',
    en: 'en-US',
    it: 'it-IT',
    pl: 'pl-PL',
    de: 'de-DE',
  };
  const locale = localeMap[language.toLowerCase()] || 'uk-UA';

  try {
    const d = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
    });
  } catch (err) {
    console.warn('[formatLocalizedDate] Error formatting date:', err);
    return dateString;
  }
}

/**
 * Pluralization helper for Slavic and other languages.
 */
export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const cases = [2, 0, 1, 1, 1, 2];
  return forms[abs % 100 > 4 && abs % 100 < 20 ? 2 : cases[abs % 10 < 5 ? abs % 10 : 5]];
}
