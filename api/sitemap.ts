import { buildSitemapXml, type SitemapItem } from '../src/edge/sitemap-xml';

export async function GET(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const siteUrl = (process.env['SITE_URL'] ?? origin).replace(/\/+$/, '');
  const backend = (process.env['BACKEND_API_URL'] ?? '').replace(/\/+$/, '');

  let items: SitemapItem[] = [];
  let backendOk = false;
  if (backend) {
    try {
      const res = await fetch(`${backend}/seo/sitemap`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) { items = ((await res.json()) as { items?: SitemapItem[] }).items ?? []; backendOk = true; }
    } catch { /* serve the static pages only */ }
  }

  return new Response(buildSitemapXml(siteUrl, items), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Not locale-varying, so CDN caching is safe here (unlike the HTML shell). Shorter TTL while the backend is failing.
      'cache-control': backendOk ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'public, s-maxage=300',
    },
  });
}

// Search-engine sitemap submission (Google Search Console, Bing) probes with HEAD/OPTIONS before the real GET —
// without these, the probe gets Vercel's default 405 and the submission fails even though GET works fine.
export async function HEAD(request: Request): Promise<Response> {
  const res = await GET(request);
  return new Response(null, { status: res.status, headers: res.headers });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: { allow: 'GET, HEAD, OPTIONS' } });
}
