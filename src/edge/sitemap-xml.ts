import { canonicalUrl } from '../app/core/seo/seo.util';

export interface SitemapItem { id: string; updatedAt: string; }

/** Public, indexable app pages. (/karma-history is private; /shared/* come from the backend.) */
export const STATIC_SITEMAP_PATHS = ['/', '/about', '/terms', '/privacy'] as const;

const MAX_URLS = 50000;

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function buildSitemapXml(siteUrl: string, items: SitemapItem[], extraPaths: string[] = []): string {
  const statics = [...STATIC_SITEMAP_PATHS, ...extraPaths]
    .map(p => `  <url><loc>${escapeXml(canonicalUrl(siteUrl, p))}</loc></url>`);
  const shared = items
    .slice(0, MAX_URLS - statics.length)
    .map(i => `  <url><loc>${escapeXml(canonicalUrl(siteUrl, `/shared/${encodeURIComponent(i.id)}`))}</loc><lastmod>${escapeXml(i.updatedAt)}</lastmod></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...statics,
    ...shared,
    '</urlset>',
    '',
  ].join('\n');
}
