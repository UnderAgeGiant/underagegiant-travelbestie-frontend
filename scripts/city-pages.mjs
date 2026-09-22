/**
 * Emits one static HTML per city guide (real <head>, JSON-LD, <noscript> summary) + city-sitemap.json.
 * Called from scripts/post-build.mjs after the es-CL index.html is published. The .ts modules below are
 * IMPORT-FREE on purpose so Node's built-in type stripping (>= 22.18) can load them here.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_GUIDES } from '../src/app/data/city-guides.data.ts';
import { guideTitle, guideDescription, guidePath, isGuideAttraction, pickTopSights } from '../src/app/core/seo/city-guide-seo.util.ts';
import { evaluateGuideQuality } from '../src/app/core/seo/guide-quality.util.ts';
import { cityGuideJsonLd } from '../src/app/core/seo/city-guide-jsonld.util.ts';
import { applyHeadToShell, escapeHtml as esc } from './seo-head.mjs';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', 'data');
const lf = (s) => s.split('\r\n').join('\n');

export function loadCurated(path = join(DATA_DIR, 'attractions-curated.ts')) {
  const src = lf(readFileSync(path, 'utf8'));
  return eval(`(${src.slice(src.indexOf('= {') + 2).trimEnd().replace(/;$/, '')})`);
}

export function loadCities(path = join(DATA_DIR, 'cities.data.ts')) {
  return [...lf(readFileSync(path, 'utf8')).matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*country:\s*'([^']+)'/g)]
    .map((m) => ({ id: m[1], name: m[2], country: m[3] }));
}

/** Mirrors the app's stripInsecureImages(): http:// images are dropped (mixed content), so quality is judged as users see it. */
const secure = (a) => (a.imageUrl && a.imageUrl.startsWith('http://') ? { ...a, imageUrl: undefined } : a);

export function buildGuidePage({ shell, entry, city, attractions, siteUrl }) {
  const origin = siteUrl.replace(/\/+$/, '');
  const list = attractions.filter(isGuideAttraction);
  const quality = evaluateGuideQuality(list);
  const indexable = entry.reviewed && quality.ok;
  const problems = entry.reviewed && !quality.ok ? quality.reasons : [];

  const title = guideTitle(entry.displayName);
  const description = guideDescription(entry.displayName, list.length);
  const path = guidePath(entry.slug);
  const url = `${origin}${path}`;
  const image = `${origin}/og-default.png`;
  const top = pickTopSights(list, 10);
  const ld = JSON.stringify(cityGuideJsonLd({
    siteUrl: origin, slug: entry.slug, displayName: entry.displayName, country: city.country, description,
    sights: top.map((a) => ({ name: a.name, description: a.description, image: a.imageUrl, lat: a.lat, lng: a.lng })),
  })).replace(/</g, '\\u003c');

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    ...(indexable ? [] : ['<meta name="robots" content="noindex,follow">']),
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Tripilove">',
    '<meta property="og:locale" content="es_CL">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    // id must equal SeoService's JSON_LD_ID ('tb-jsonld') so the client REPLACES this block instead of duplicating it.
    `<script type="application/ld+json" id="tb-jsonld">${ld}</script>`,
  ].join('\n  ');

  const noscript = `<noscript><main><h1>Qué hacer en ${esc(entry.displayName)}</h1><p>${esc(entry.intro)}</p><ul>`
    + top.map((a) => `<li>${esc(a.name)}</li>`).join('')
    + '</ul></main></noscript>';

  const html = applyHeadToShell(shell, head).replace('<app-root></app-root>', () => `<app-root></app-root>\n  ${noscript}`);
  return { html, indexable, problems, path };
}

export function buildCityPages({ distDir, siteUrl, guides = CITY_GUIDES, cities = loadCities(), curated = loadCurated() }) {
  const shell = readFileSync(join(distDir, 'index.html'), 'utf8');
  const outDir = join(distDir, 'city');
  mkdirSync(outDir, { recursive: true });
  const written = [];
  const indexablePaths = [];
  const failures = [];

  for (const entry of guides) {
    const city = cities.find((c) => c.id === entry.cityId);
    if (!city) throw new Error(`city-pages: "${entry.cityId}" is not in WORLD_CITIES`);
    const page = buildGuidePage({ shell, entry, city, attractions: (curated[entry.cityId] ?? []).map(secure), siteUrl });
    if (page.problems.length) failures.push(`${entry.slug}: ${page.problems.join('; ')}`);
    const file = join(outDir, `${entry.slug}.html`);
    writeFileSync(file, page.html, 'utf8');
    written.push(file);
    if (page.indexable) indexablePaths.push(page.path);
  }
  if (failures.length) {
    throw new Error(`city-pages: reviewed guides below the quality floor — fix the data or set reviewed:false:\n - ${failures.join('\n - ')}`);
  }
  writeFileSync(join(distDir, 'city-sitemap.json'), JSON.stringify({ paths: indexablePaths }), 'utf8');
  console.log(`city-pages: wrote ${written.length} guide page(s); ${indexablePaths.length} indexable`);
  return { written, indexablePaths };
}
