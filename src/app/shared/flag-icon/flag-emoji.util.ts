/** Codepoint of 🇦 (REGIONAL INDICATOR SYMBOL LETTER A). Regional-indicator
 *  flag emoji are always two of these symbols back to back, one per letter
 *  of the ISO 3166-1 alpha-2 code, in the same A–Z order as the alphabet. */
const REGIONAL_INDICATOR_BASE = 0x1f1e6;

/**
 * Converts a two-codepoint regional-indicator flag emoji (e.g. '🇫🇷') to the
 * lowercase ISO 3166-1 alpha-2 code flagcdn.com expects (e.g. 'fr'). Returns
 * null for anything else — a single-codepoint glyph like '📍' or '🏠', plain
 * text, or an empty string — so callers can fall back gracefully instead of
 * building a broken image URL.
 */
export function countryCodeFromFlagEmoji(flag: string): string | null {
  const codePoints = Array.from(flag).map(ch => ch.codePointAt(0) ?? 0);
  if (codePoints.length !== 2) return null;
  const letters = codePoints.map(cp => cp - REGIONAL_INDICATOR_BASE);
  if (letters.some(n => n < 0 || n > 25)) return null;
  return letters.map(n => String.fromCharCode(97 + n)).join('');
}
