/**
 * Shared plans with fewer planned attractions than this are thin content → `noindex`.
 * MIRRORS `SEO_MIN_ATTRACTIONS` in the backend's `src/lib/seo.ts` — change both together.
 */
export const SEO_MIN_ATTRACTIONS = 3;
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 155;

/** Absolute canonical URL for an app path: drops query/hash, duplicate and trailing slashes; '/' → `${origin}/`. */
export function canonicalUrl(siteUrl: string, path: string): string {
  const origin = siteUrl.replace(/\/+$/, '');
  const clean = path.split('#')[0].split('?')[0].replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  if (clean === '') return `${origin}/`;
  return `${origin}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

export function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:—-]+$/, '')}…`;
}

export function joinList(items: string[], locale: string): string {
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

/** JSON for an inline `application/ld+json` block; `<` is escaped so no value can terminate the script element. */
export function jsonLdText(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
