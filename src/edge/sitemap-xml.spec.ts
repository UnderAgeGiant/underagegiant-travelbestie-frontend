import { buildSitemapXml } from './sitemap-xml';

const SITE = 'https://tripilove.com';

describe('buildSitemapXml', () => {
  it('lists the static pages without lastmod', () => {
    const xml = buildSitemapXml(SITE, []);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const p of ['/', '/about', '/terms', '/privacy']) {
      expect(xml).toContain(`<loc>${SITE}${p}</loc>`);
    }
    expect(xml).not.toContain('<lastmod>');
    expect(xml).not.toContain('karma-history');
  });

  it('lists shared plans with lastmod and the /shared/<id> canonical form', () => {
    const xml = buildSitemapXml(SITE, [{ id: 'abc', updatedAt: '2026-09-01T00:00:00.000Z' }]);
    expect(xml).toContain('<loc>https://tripilove.com/shared/abc</loc>');
    expect(xml).toContain('<lastmod>2026-09-01T00:00:00.000Z</lastmod>');
  });

  it('escapes XML-special characters in ids', () => {
    const xml = buildSitemapXml(SITE, [{ id: 'a&b<c', updatedAt: '2026-09-01T00:00:00.000Z' }]);
    expect(xml).not.toContain('a&b<c');
    expect(xml).toContain('a%26b%3Cc');
  });

  it('XML-escapes lastmod values (escapeXml, not just encodeURIComponent)', () => {
    const xml = buildSitemapXml(SITE, [{ id: 'abc', updatedAt: '2026-09-01T00:00:00Z&x<y' }]);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).not.toContain('&x<y');
  });

  it('caps at the 50,000-URL protocol limit', () => {
    const many = Array.from({ length: 60000 }, (_, i) => ({ id: `id${i}`, updatedAt: '2026-09-01T00:00:00.000Z' }));
    expect(buildSitemapXml(SITE, many).match(/<url>/g)).toHaveLength(50000);
  });
});
