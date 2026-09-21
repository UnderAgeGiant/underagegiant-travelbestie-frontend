import { routes } from '../app/app.routes';
import { shareRedirectPath } from '../app/core/routing/share-redirect.util';
import { isCrawler, isKnownRoute, legacyShareTarget, pickLocale, sharedIdFromPath } from './edge-routing';

describe('pickLocale (same rules the old middleware had)', () => {
  it('cookie wins', () => {
    expect(pickLocale('a=1; tb_locale=en-US', 'es')).toBe('en-US');
    expect(pickLocale('tb_locale=es-CL', 'en-US,en;q=0.9')).toBe('es-CL');
  });
  it('falls back to Accept-Language only when there is no cookie', () => {
    expect(pickLocale(null, 'en-GB,en;q=0.9')).toBe('en-US');
    expect(pickLocale(null, null)).toBe('es-CL');
  });
});

describe('isCrawler', () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0', 'WhatsApp/2.23.20.0', 'Slackbot-LinkExpanding 1.0', 'LinkedInBot/1.0',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  ])('detects %s', (ua) => expect(isCrawler(ua)).toBe(true));

  it('does not flag normal browsers or a missing UA', () => {
    expect(isCrawler('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')).toBe(false);
    expect(isCrawler(null)).toBe(false);
  });
});

describe('sharedIdFromPath', () => {
  it('extracts a single-segment id', () => {
    expect(sharedIdFromPath('/shared/abc-123')).toBe('abc-123');
    expect(sharedIdFromPath('/shared/abc-123/')).toBe('abc-123');
  });
  it('rejects anything else', () => {
    expect(sharedIdFromPath('/shared')).toBeNull();
    expect(sharedIdFromPath('/shared/a/b')).toBeNull();
    expect(sharedIdFromPath('/about')).toBeNull();
  });
});

describe('isKnownRoute', () => {
  it('knows the app routes', () => {
    for (const p of ['/', '/about', '/terms', '/privacy', '/karma-history', '/shared/abc', '/about/']) {
      expect(isKnownRoute(p)).toBe(true);
    }
  });
  it('rejects unknown paths', () => {
    for (const p of ['/nope', '/shared', '/shared/a/b', '/about/team', '/wp-admin']) {
      expect(isKnownRoute(p)).toBe(false);
    }
  });
  it('GUARD: every real route in app.routes.ts (except the wildcard) is known to the edge', () => {
    const missing = routes
      .filter(r => r.path !== undefined && r.path !== '**')
      .map(r => '/' + r.path!.replace(/:[^/]+/g, 'sample'))
      .filter(p => !isKnownRoute(p));
    expect(missing).toEqual([]);
  });
});

describe('legacyShareTarget', () => {
  it('matches the client-side shareRedirectPath contract', () => {
    for (const s of ['?share=abc', '?share=abc&highlight=clone', '?highlight=clone', '', '?x=1']) {
      expect(legacyShareTarget(s)).toBe(shareRedirectPath(s));
    }
  });
});
