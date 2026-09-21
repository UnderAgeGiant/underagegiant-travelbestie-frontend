import { config } from '../../middleware';

// Vercel compiles a matcher string to an anchored regex; mirror that here.
const matches = (path: string): boolean =>
  config.matcher.some(m => new RegExp(`^${m}$`).test(path));

describe('middleware matcher', () => {
  it('runs on app routes (with or without a trailing slash)', () => {
    for (const p of ['/', '/about', '/terms', '/privacy', '/karma-history', '/shared/abc', '/shared/abc/', '/no-such-page']) {
      expect(matches(p)).toBe(true);
    }
  });

  it('skips API functions — the crawler rewrite target /api/shared-page is extensionless and not an app route, so a re-run would 404 it', () => {
    for (const p of ['/api/shared-page', '/api/sitemap']) {
      expect(matches(p)).toBe(false);
    }
  });

  it('skips anything with a file extension (static assets, the locale shells, /sitemap.xml, /robots.txt)', () => {
    for (const p of ['/sitemap.xml', '/robots.txt', '/index.html', '/index.en-US.html', '/og-default.png', '/main-ABC123.js']) {
      expect(matches(p)).toBe(false);
    }
  });
});
