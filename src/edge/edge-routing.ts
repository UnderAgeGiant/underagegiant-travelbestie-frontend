import { guideBySlug } from '../app/data/city-guides.data';

export type EdgeLocale = 'es-CL' | 'en-US';

// Pure helpers shared by middleware.ts, api/*.ts and jest — this file may import the (import-free)
// city guide manifest, but otherwise stays free of Angular/Node imports.

const BOT_UA = new RegExp(
  '(googlebot|adsbot-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandex(bot)?|applebot|' +
  'facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|' +
  'pinterest(bot)?|redditbot|embedly|skypeuripreview|vkshare|iframely|quora link preview)', 'i');

export function isCrawler(userAgent: string | null): boolean {
  return !!userAgent && BOT_UA.test(userAgent);
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const hit = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

/** Same rules the pre-SEO middleware used: tb_locale cookie wins; Accept-Language only when there is no cookie. */
export function pickLocale(cookieHeader: string | null, acceptLanguage: string | null): EdgeLocale {
  const cookie = readCookie(cookieHeader, 'tb_locale');
  const prefersEnglish = /^en/i.test(acceptLanguage ?? '');
  return cookie === 'en-US' || (!cookie && prefersEnglish) ? 'en-US' : 'es-CL';
}

const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export function sharedIdFromPath(pathname: string): string | null {
  const m = /^\/shared\/([^/]+)$/.exec(trim(pathname));
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; } // malformed %-escape → treat as unknown path
}

export function citySlugFromPath(pathname: string): string | null {
  const m = /^\/ciudad\/([^/]+)$/.exec(trim(pathname));
  if (!m) return null;
  try {
    const slug = decodeURIComponent(m[1]);
    return guideBySlug(slug) ? slug : null;
  } catch { return null; }
}

/** Every path the SPA can render. A jest guard fails if app.routes.ts gains a route missing here. */
const STATIC_ROUTES = new Set(['/', '/about', '/terms', '/privacy', '/karma-history']);

export function isKnownRoute(pathname: string): boolean {
  const p = trim(pathname);
  return STATIC_ROUTES.has(p) || sharedIdFromPath(p) !== null || citySlugFromPath(p) !== null;
}

/** Legacy `?share=<id>[&highlight=…]` → `/shared/<id>[?highlight=…]` (301 at the edge; the client shim stays for old in-app links). */
export function legacyShareTarget(search: string): string | null {
  const params = new URLSearchParams(search);
  const id = params.get('share');
  if (!id) return null;
  const highlight = params.get('highlight');
  return `/shared/${encodeURIComponent(id)}${highlight ? `?highlight=${encodeURIComponent(highlight)}` : ''}`;
}
