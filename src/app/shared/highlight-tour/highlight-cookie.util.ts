export const HIGHLIGHT_COOKIE_PREFIX = 'tb_highlight_seen_';
export const HIGHLIGHT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year, "permanent" for practical purposes

export function highlightCookieKey(type: string): string {
  return `${HIGHLIGHT_COOKIE_PREFIX}${type}`;
}
