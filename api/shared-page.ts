import { applyHead, buildNotFoundHead, buildSharedHead, type SharedSeoSummary } from '../src/edge/shared-head';
import type { EdgeLocale } from '../src/edge/edge-routing';

const HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' };

/**
 * Reached only via middleware.ts (crawler UA on /shared/:id). Serves the same SPA shell every visitor gets,
 * with a per-plan <head>. Backend slow/down/429 → plain shell with default tags (200) — never blocks a scraper.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  const locale: EdgeLocale = url.searchParams.get('loc') === 'en-US' ? 'en-US' : 'es-CL';
  const siteUrl = (process.env['SITE_URL'] ?? url.origin).replace(/\/+$/, '');
  const backend = (process.env['BACKEND_API_URL'] ?? '').replace(/\/+$/, '');

  const shellRes = await fetch(new URL(locale === 'en-US' ? '/index.en-US.html' : '/index.html', url.origin));
  if (!shellRes.ok) return new Response('Shell unavailable', { status: 502 });
  const shell = await shellRes.text();

  if (!backend || !id) return new Response(shell, { status: 200, headers: HEADERS });

  try {
    const res = await fetch(`${backend}/seo/shared/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(3500) });
    if (res.status === 404) {
      return new Response(applyHead(shell, buildNotFoundHead(locale)), { status: 404, headers: HEADERS });
    }
    if (res.ok) {
      const summary = (await res.json()) as SharedSeoSummary;
      return new Response(applyHead(shell, buildSharedHead(summary, locale, siteUrl).head), { status: 200, headers: HEADERS });
    }
  } catch { /* fall through to the plain shell */ }
  return new Response(shell, { status: 200, headers: HEADERS });
}
