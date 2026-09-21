#!/usr/bin/env node
/**
 * Post-deploy SEO smoke test (Feature 66). Run against a preview BEFORE enabling SEO_SHARED_HEAD, and again after
 * every production deploy. Exits non-zero if any check fails.
 *
 *   node scripts/smoke-seo.mjs https://<host> [--no-shared-head] [--api https://api.tripilove.com] [--id <shareId>]
 *
 *   --no-shared-head  SEO_SHARED_HEAD is OFF on this deployment: expect crawlers to get the plain static shell
 *                     (200, default title) on /shared/<id> and on a bogus id, instead of the per-plan head / 404.
 *   --api <url>       backend base URL used to pick a real shared plan from GET /feed?limit=1
 *                     (env SMOKE_API_URL; default https://api.tripilove.com). Falls back to the first
 *                     /shared/<id> entry of the deployment's own sitemap.
 *   --id <shareId>    use this shared plan instead of discovering one.
 *   Vercel Deployment Protection: set VERCEL_BYPASS_TOKEN to send `x-vercel-protection-bypass`.
 */
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/+$/, '');
if (!base) { console.error('usage: node scripts/smoke-seo.mjs https://<host> [--no-shared-head] [--api <url>] [--id <shareId>]'); process.exit(2); }

const expectHead = !flag('--no-shared-head');
const api = (opt('--api') ?? process.env.SMOKE_API_URL ?? 'https://api.tripilove.com').replace(/\/+$/, '');
const CRAWLER = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const HUMAN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const get = (path, ua = HUMAN, extra = {}) => fetch(base + path, {
  redirect: 'manual',
  headers: { 'user-agent': ua, ...(process.env.VERCEL_BYPASS_TOKEN ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN } : {}) },
  ...extra,
});

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -> ${detail}`}`);
  if (!ok) failed++;
};
const guard = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, `threw ${e?.message ?? e}`); } };

console.log(`SEO smoke: ${base}  (shared head ${expectHead ? 'EXPECTED' : 'not expected'})\n`);

await guard('GET /robots.txt', async () => {
  const r = await get('/robots.txt'); const t = await r.text();
  check('/robots.txt 200 with Sitemap line', r.status === 200 && /^Sitemap:\s*\S+\/sitemap\.xml/m.test(t), `status ${r.status}`);
});

let sitemapText = '';
await guard('GET /sitemap.xml', async () => {
  const r = await get('/sitemap.xml'); sitemapText = await r.text();
  const ct = r.headers.get('content-type') ?? '';
  check('/sitemap.xml 200', r.status === 200, `status ${r.status}: ${sitemapText.slice(0, 80)}`);
  check('/sitemap.xml is application/xml', /application\/xml/.test(ct), `content-type ${ct}`);
  check('/sitemap.xml contains <urlset', sitemapText.includes('<urlset'), sitemapText.slice(0, 80));
});

let id = opt('--id');
if (!id) {
  try {
    const f = await fetch(`${api}/feed?limit=1`); id = (await f.json()).items?.[0]?.id;
  } catch { /* fall back to the sitemap */ }
  id ??= /<loc>[^<]*\/shared\/([^<]+)<\/loc>/.exec(sitemapText)?.[1];
}
if (!id) { check('found a real shared plan id (feed or sitemap)', false, 'pass --id <shareId>'); }
else {
  console.log(`\nusing shared plan ${id}\n`);
  await guard('crawler on real plan', async () => {
    const r = await get(`/shared/${id}`, CRAWLER); const t = await r.text();
    const title = /<title>([^<]*)<\/title>/.exec(t)?.[1] ?? '';
    check('crawler /shared/<id> 200', r.status === 200, `status ${r.status}`);
    if (expectHead) {
      check('crawler gets per-plan <title> "… itinerario en Tripilove"', /itinerario en Tripilove/i.test(title), `title "${title}"`);
      check('crawler gets rel="canonical" → /shared/<id>', new RegExp(`rel="canonical" href="[^"]*/shared/${id}"`).test(t), 'no matching canonical');
      check('crawler gets og:title + TouristTrip JSON-LD', /property="og:title"/.test(t) && /tb-jsonld-shared/.test(t), 'missing og:title or tb-jsonld-shared');
    } else {
      check('crawler gets the static shell (no per-plan head)', !/itinerario en Tripilove/i.test(title) && /<app-root/.test(t), `title "${title}"`);
    }
  });
  await guard('human on real plan', async () => {
    const r = await get(`/shared/${id}`); const t = await r.text();
    check('human /shared/<id> 200 static shell', r.status === 200 && /<app-root/.test(t), `status ${r.status}`);
  });
  await guard('legacy ?share= redirect', async () => {
    const r = await get(`/?share=${id}`);
    const loc = r.headers.get('location') ?? '';
    check('/?share=<id> → 301 /shared/<id>', r.status === 301 && loc.endsWith(`/shared/${id}`), `status ${r.status} location "${loc}"`);
  });
}

await guard('crawler on bogus plan', async () => {
  const r = await get('/shared/does-not-exist-smoke-000', CRAWLER);
  check(expectHead ? 'crawler bogus id → 404' : 'crawler bogus id → 200 static shell (flag off)', r.status === (expectHead ? 404 : 200), `status ${r.status}`);
});
await guard('garbage URL', async () => {
  const r = await get('/definitely-not-a-page');
  check('unknown path → 404', r.status === 404, `status ${r.status}`);
});
await guard('home head', async () => {
  const r = await get('/'); const t = await r.text();
  check('/ has description, og:image and site JSON-LD', /name="description"/.test(t) && /property="og:image"/.test(t) && /tb-jsonld-site/.test(t), 'missing default head tags');
});

console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed');
process.exit(failed ? 1 : 0);
