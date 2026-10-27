export const HIGHLIGHT_STORAGE_PREFIX = 'tb_highlight_seen_';

export function highlightStorageKey(type: string): string {
  return `${HIGHLIGHT_STORAGE_PREFIX}${type}`;
}

/** Permanent per-device "this tour was shown here" flag (localStorage, 2026-10-25). */
export function highlightDeviceKey(type: string): string {
  return `tb_highlight_device_seen_${type}`;
}
