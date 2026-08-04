/**
 * Lowercases and strips diacritics so search matches regardless of accents —
 * e.g. normalizeSearch('Bogotá') === normalizeSearch('bogota').
 */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
