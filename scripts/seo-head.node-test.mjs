import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME_META, SEO_HEAD_MARKER, buildHomeHead, injectSeoHead, buildRobotsTxt } from './seo-head.mjs';

const SITE = 'https://tripilove.com';
const SHELL = `<!doctype html><html lang="es-CL"><head><title>Tripilove</title>${SEO_HEAD_MARKER}</head><body></body></html>`;

test('home descriptions fit the 155-char budget and titles the 60-char budget', () => {
  for (const m of Object.values(HOME_META)) {
    assert.ok(m.description.length <= 155, m.description);
    assert.ok(m.title.length <= 60, m.title);
  }
});

test('injectSeoHead replaces marker + title and sets lang per locale', () => {
  const es = injectSeoHead(SHELL, 'es-CL', SITE);
  assert.ok(!es.includes(SEO_HEAD_MARKER));
  assert.match(es, /<title>Tripilove — Planificador de viajes con IA<\/title>/);
  assert.match(es, /<meta property="og:locale" content="es_CL">/);
  const en = injectSeoHead(SHELL, 'en-US', SITE);
  assert.match(en, /<html lang="en-US">/);
  assert.match(en, /<meta property="og:locale" content="en_US">/);
});

test('OG image and site url are absolute and use SITE_URL', () => {
  const head = buildHomeHead('es-CL', SITE);
  assert.match(head, /<meta property="og:image" content="https:\/\/tripilove\.com\/og-default\.png">/);
  assert.match(head, /<meta name="twitter:card" content="summary_large_image">/);
});

test('JSON-LD has Organization + WebSite, sameAs only when provided, and is script-safe', () => {
  const none = buildHomeHead('es-CL', SITE);
  assert.ok(!none.includes('sameAs'));
  const some = buildHomeHead('es-CL', SITE, ['https://instagram.com/tripilove']);
  assert.match(some, /"sameAs":\["https:\/\/instagram\.com\/tripilove"\]/);
  const ld = some.match(/<script type="application\/ld\+json" id="tb-jsonld-site">([\s\S]*?)<\/script>/)[1];
  const parsed = JSON.parse(ld);
  assert.deepEqual(parsed['@graph'].map(n => n['@type']).sort(), ['Organization', 'WebSite']);
});

test('JSON-LD escapes "<" so a hostile sameAs entry cannot close the script block', () => {
  const evil = '</script><b>';
  const head = buildHomeHead('es-CL', SITE, [evil]);
  const block = head.slice(head.indexOf('<script type="application/ld+json" id="tb-jsonld-site">'));
  assert.equal((block.match(/<\/script>/g) || []).length, 1);
  assert.ok(!head.includes(evil));
  const ld = block.match(/id="tb-jsonld-site">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(ld)['@graph'][0].sameAs[0], evil);
});

test('robots.txt allows crawling, blocks the private route and points at the sitemap', () => {
  const txt = buildRobotsTxt(SITE);
  assert.match(txt, /User-agent: \*/);
  assert.match(txt, /Disallow: \/karma-history/);
  assert.match(txt, /Sitemap: https:\/\/tripilove\.com\/sitemap\.xml/);
});
