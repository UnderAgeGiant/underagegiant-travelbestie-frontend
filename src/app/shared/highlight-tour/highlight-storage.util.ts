export const HIGHLIGHT_STORAGE_PREFIX = 'tb_highlight_seen_';

export function highlightStorageKey(type: string): string {
  return `${HIGHLIGHT_STORAGE_PREFIX}${type}`;
}
