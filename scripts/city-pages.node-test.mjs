import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGuidePage, buildCityPages } from './city-pages.mjs';
import { CITY_GUIDES } from '../src/app/data/city-guides.data.ts';

const SITE = 'https://tripilove.com';
const SHELL = '<!doctype html><html lang="es-CL"><head><title>Tripilove</title>'
  + '<meta name="description" content="Default"><meta property="og:title" content="Default">'
  + '<script type="application/ld+json" id="tb-jsonld-site">{}</script></head><body><app-root></app-root></body></html>';

const entry = (o = {}) => ({ ...CITY_GUIDES[0], reviewed: false, ...o });
const city = { id: 'madrid', name: 'Madrid', country: 'Spain' };
const sight = (i, o = {}) => ({
  id: `madrid_${i}`, active: true, category: 'poi', name: `Sitio ${i} <b>`, rating: 4.1 + (i % 8) / 10,
  imageUrl: 'https://x/y.jpg', lat: 40.4, lng: -3.7,
  description: 'Una descripción suficientemente larga para superar el umbral de sesenta caracteres.', ...o,
});
const good = Array.from({ length: 40 }, (_, i) => sight(i));

test('head: title, canonical, noindex while unreviewed; shell defaults replaced; site JSON-LD kept', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry(), city, attractions: good, siteUrl: SITE });
  assert.equal(p.path, '/ciudad/madrid');
  assert.equal(p.indexable, false);
  assert.match(p.html, /<title>Qué hacer en Madrid: guía de viaje desde Chile \| Tripilove<\/title>/);
  assert.match(p.html, /<link rel="canonical" href="https:\/\/tripilove\.com\/ciudad\/madrid">/);
  assert.match(p.html, /<meta name="robots" content="noindex,follow">/);
  assert.equal(p.html.match(/<title>/g).length, 1);
  assert.equal(p.html.match(/name="description"/g).length, 1);
  assert.equal(p.html.match(/property="og:title"/g).length, 1);
  assert.ok(p.html.includes('id="tb-jsonld-site"'));
});

test('guide JSON-LD parses, uses the client-side script id, and lists the top sights', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry(), city, attractions: good, siteUrl: SITE });
  const ld = JSON.parse(/<script type="application\/ld\+json" id="tb-jsonld">([\s\S]*?)<\/script>/.exec(p.html)[1]);
  assert.equal(ld['@graph'][0]['@type'], 'TouristDestination');
  assert.equal(ld['@graph'][0].includesAttraction.length, 10);
});

test('noscript summary is present and escaped', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry(), city, attractions: good, siteUrl: SITE });
  assert.match(p.html, /<noscript><main><h1>Qué hacer en Madrid<\/h1>/);
  assert.ok(p.html.includes('Sitio 7 &lt;b&gt;'));
  assert.ok(!p.html.includes('Sitio 7 <b>'));
});

test('reviewed + data above the floor → indexable, no robots meta, no problems', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry({ reviewed: true }), city, attractions: good, siteUrl: SITE });
  assert.equal(p.indexable, true);
  assert.deepEqual(p.problems, []);
  assert.ok(!p.html.includes('name="robots"'));
});

test('reviewed but thin data → not indexable and reports the reasons', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry({ reviewed: true }), city, attractions: good.slice(0, 10), siteUrl: SITE });
  assert.equal(p.indexable, false);
  assert.match(p.problems.join(), /active < 30/);
  assert.ok(p.html.includes('name="robots"'));
});

test('events and freetours never count as guide attractions', () => {
  const mixed = [...good.slice(0, 20), ...good.slice(20).map((a) => ({ ...a, category: 'event_party' }))];
  const p = buildGuidePage({ shell: SHELL, entry: entry({ reviewed: true }), city, attractions: mixed, siteUrl: SITE });
  assert.equal(p.indexable, false);
});

test('hostile display names cannot break out of attributes', () => {
  const p = buildGuidePage({ shell: SHELL, entry: entry({ displayName: '"><script>alert(1)</script>' }), city, attractions: good, siteUrl: SITE });
  assert.ok(!p.html.includes('"><script>alert(1)'));
});

test('buildCityPages writes one file per guide and a sitemap list of indexable paths only', () => {
  const dist = mkdtempSync(join(tmpdir(), 'city-pages-'));
  writeFileSync(join(dist, 'index.html'), SHELL);
  const guides = [entry({ reviewed: true }), entry({ slug: 'otra', cityId: 'otra', displayName: 'Otra', reviewed: false })];
  const cities = [city, { id: 'otra', name: 'Otra', country: 'Spain' }];
  const curated = { madrid: good, otra: good };
  const out = buildCityPages({ distDir: dist, siteUrl: SITE, guides, cities, curated });
  assert.ok(existsSync(join(dist, 'city', 'madrid.html')));
  assert.ok(existsSync(join(dist, 'city', 'otra.html')));
  assert.deepEqual(JSON.parse(readFileSync(join(dist, 'city-sitemap.json'), 'utf8')), { paths: ['/ciudad/madrid'] });
  assert.equal(out.written.length, 2);
});

test('buildCityPages FAILS THE BUILD when a reviewed guide is below the quality floor', () => {
  const dist = mkdtempSync(join(tmpdir(), 'city-pages-'));
  writeFileSync(join(dist, 'index.html'), SHELL);
  assert.throws(
    () => buildCityPages({ distDir: dist, siteUrl: SITE, guides: [entry({ reviewed: true })], cities: [city], curated: { madrid: good.slice(0, 10) } }),
    /below the quality floor/,
  );
});

test('buildCityPages rejects a guide whose city is not in the catalog', () => {
  const dist = mkdtempSync(join(tmpdir(), 'city-pages-'));
  writeFileSync(join(dist, 'index.html'), SHELL);
  assert.throws(() => buildCityPages({ distDir: dist, siteUrl: SITE, guides: [entry()], cities: [], curated: {} }), /not in WORLD_CITIES/);
});
