/**
 * Commons file page for a Wikimedia-hosted commons image URL (thumbnail or original); null otherwise.
 * Accepts both `upload.wikimedia.org` (original files) and `thumb.wikimedia.org` (the CDN host the
 * imageinfo API's `thumburl` now serves resized thumbnails from — verified live 2026-09-22, see
 * docs/superpowers/plans-reports/2026-09-21-city-guide-pages-ledger.md) — same commons path shape on both.
 */
export function photoCreditUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  let u: URL;
  try { u = new URL(imageUrl); } catch { return null; }
  if (u.hostname !== 'upload.wikimedia.org' && u.hostname !== 'thumb.wikimedia.org') return null;
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'wikipedia' || parts[1] !== 'commons') return null;
  const file = parts[2] === 'thumb' ? parts[5] : parts[4];
  return file ? `https://commons.wikimedia.org/wiki/File:${file}` : null;
}
