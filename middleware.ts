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
import { isCrawler, isKnownRoute, legacyShareTarget, pickLocale, sharedIdFromPath } from './src/edge/edge-routing';

// Runs on any path that does NOT end in a file extension (same shape as the old vercel.json rewrite `source`),
// EXCEPT /api/*. The crawler branch below rewrites /shared/:id to /api/shared-page, which has no file extension
// and is not an app route — if Vercel ever re-ran this middleware on that internal rewrite target, step 3
// (isKnownRoute) would answer it with a 404 and crawlers would never get their per-plan head. Excluding /api/
// here makes that impossible instead of relying on Vercel's rewrite semantics. (Covered by
// src/edge/middleware-config.spec.ts.)
export const config = {
  matcher: ['/((?!api/|.*\\.[^/]+$).*)'],
};

const NO_STORE = 'private, no-store';

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // 1. Legacy `/?share=<id>` links → the real /shared/<id> URL (permanent).
  if (url.pathname === '/') {
    const target = legacyShareTarget(url.search);
    if (target) return Response.redirect(new URL(target, url), 301);
  }

  const locale = pickLocale(request.headers.get('cookie'), request.headers.get('accept-language'));
  const shell = locale === 'en-US' ? '/index.en-US.html' : '/index.html';

  // 2. Crawlers/scrapers on a shared plan get a per-plan <head> from a function (humans get the static shell).
  //    Gated behind SEO_SHARED_HEAD=on (default OFF): when off, crawlers get the normal static shell (200) —
  //    the safe fallback while /api/shared-page is unverified in production. See scripts/smoke-seo.mjs.
  const sharedId = sharedIdFromPath(url.pathname);
  if (sharedId && process.env['SEO_SHARED_HEAD'] === 'on' && isCrawler(request.headers.get('user-agent'))) {
    const res = rewrite(new URL(`/api/shared-page?id=${encodeURIComponent(sharedId)}&loc=${locale}`, url));
    res.headers.set('Cache-Control', NO_STORE);
    return res;
  }

  // 3. Unknown path → a REAL 404 (the SPA shell still loads and renders NotFoundComponent).
  if (!isKnownRoute(url.pathname)) {
    const upstream = await fetch(new URL(shell, url));
    return new Response(upstream.body, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': NO_STORE },
    });
  }

  // 4. Known app route → locale bundle (unchanged behaviour).
  const response = rewrite(new URL(shell, url));
  response.headers.set('Cache-Control', NO_STORE);
  return response;
}
