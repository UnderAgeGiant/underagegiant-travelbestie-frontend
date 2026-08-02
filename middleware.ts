/**
 * Routing Middleware — decides which locale bundle (index.html / es-CL, or
 * index.en-US.html / en-US) to serve for a given app route, based on the
 * tb_locale cookie (fallback: Accept-Language on first visit).
 *
 * This REPLACES the old declarative vercel.json `rewrites` + `has`/`missing`
 * cookie conditions for the same job. Those were removed because Vercel's
 * Edge Network caches responses produced by static-file rewrites keyed only
 * by URL path — it does not vary the cache by Cookie. Once any single
 * visitor's request populated the cache for "/", every other visitor (and
 * that same visitor on a later reload) got served that exact cached locale
 * regardless of their own tb_locale cookie, even with a brand-new
 * cache-busting query string (confirmed live on production: identical
 * etag/last-modified served as x-vercel-cache: HIT across different cookie
 * values and different query strings, with Age correctly incrementing —
 * ruling out a local/proxy cache and confirming it was Vercel's own edge).
 * A `Cache-Control: private, no-store` response header (added in an earlier
 * fix) rides along in the cached object but does not stop Vercel's edge
 * from serving that stored copy to later requests with a different cookie.
 *
 * Routing Middleware runs fresh on every matched request — it is a Function
 * invocation, not a static asset, so it is never subject to that edge cache.
 * This is Vercel's own recommended mechanism for exactly this kind of
 * per-request cookie/header-based content negotiation.
 */
import { rewrite } from '@vercel/functions';

// Same shape as the old vercel.json rewrite `source`: match any path that
// does NOT end in a file extension — i.e. app routes like "/", "/about",
// "/shared/:id" — everything the SPA-fallback can route to. Real static
// files (hashed es-CL/en-US bundles, images, favicon) all have extensions
// and never hit this middleware; they're served directly from disk.
export const config = {
  matcher: ['/((?!.*\\.[^/]+$).*)'],
};

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const hit = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

export default function middleware(request: Request) {
  const cookieLocale = readCookie(request.headers.get('cookie'), 'tb_locale');
  const prefersEnglish = /^en/i.test(request.headers.get('accept-language') ?? '');
  const useEnglish = cookieLocale === 'en-US' || (!cookieLocale && prefersEnglish);

  const response = rewrite(new URL(useEnglish ? '/index.en-US.html' : '/index.html', request.url));
  // Belt-and-suspenders: this response is generated fresh by a Function on
  // every request, so it's not edge-cached, but explicitly marking it
  // private/no-store also stops the browser (or any downstream proxy) from
  // caching a locale-specific response under the shared "/" URL.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
