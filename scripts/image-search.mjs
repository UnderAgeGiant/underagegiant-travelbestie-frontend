/**
 * image-search.mjs — keyless image sourcing: Wikimedia Commons full-text
 * search -> Wikipedia page-summary image -> Openverse CC aggregator.
 * Ported from lib/expand-country.mjs Phase 5 (root, not visible to the
 * cloud routine). No API keys, no Unsplash.
 */
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const OPENVERSE_API = 'https://api.openverse.org/v1/images/';
const WIKIPEDIA_LANGS = ['es', 'en'];
const UA = 'TravelBestie-attraction-fix-loop/1.0 Node/20';
const COMMONS_SEARCH_DELAY = 1000;
const WIKIPEDIA_DELAY = 800;
const OPENVERSE_DELAY = 3000;
const THUMB_WIDTH = 1600;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJson(url, headers = {}, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (res.status === 429 && attempt < retries) {
      const retryAfterMs = Number(res.headers.get('retry-after')) * 1000 || 2 ** attempt * 1000;
      await sleep(retryAfterMs);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
  }
}

async function resolveCommonsUrl(filename) {
  const url = `${COMMONS_API}?action=query&titles=${encodeURIComponent(`File:${filename}`)}&prop=imageinfo&iiprop=url&iiurlwidth=${THUMB_WIDTH}&format=json`;
  const data = await fetchJson(url, { 'User-Agent': UA });
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.thumburl ?? null;
}

export async function searchCommonsByName(name, cityName) {
  const query = `${name} ${cityName}`;
  const url = `${COMMONS_API}?action=query&list=search&srnamespace=6&srlimit=5&format=json&srsearch=${encodeURIComponent(query)}`;
  const data = await fetchJson(url, { 'User-Agent': UA });
  const hits = data.query?.search ?? [];
  for (const hit of hits) {
    const filename = hit.title.replace(/^File:/, '');
    const cdnUrl = await resolveCommonsUrl(filename);
    if (cdnUrl) return cdnUrl;
  }
  return null;
}

export async function searchWikipediaImage(name, cityName) {
  for (const lang of WIKIPEDIA_LANGS) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=${encodeURIComponent(`${name} ${cityName}`)}`;
      const searchData = await fetchJson(searchUrl, { 'User-Agent': UA });
      const title = searchData.query?.search?.[0]?.title;
      if (!title) continue;
      const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summary = await fetchJson(summaryUrl, { 'User-Agent': UA });
      const img = summary.originalimage?.source ?? summary.thumbnail?.source;
      if (img) return img;
    } catch {
      // try next language
    }
  }
  return null;
}

export async function searchOpenverse(name, cityName, country) {
  const query = `${name} ${cityName} ${country}`;
  const url = `${OPENVERSE_API}?q=${encodeURIComponent(query)}&page_size=5&mature=false`;
  const data = await fetchJson(url, { 'User-Agent': UA });
  const results = data.results ?? [];
  return results.find(r => r.url && (r.width ?? 0) >= 600)?.url ?? results[0]?.url ?? null;
}

/**
 * Tries Commons -> Wikipedia -> Openverse in order, skipping any URL already
 * in `excludeUrls` (a Set) so a duplicate-image fix never reintroduces the
 * same collision. Returns the first genuinely new URL found, or null.
 */
export async function findUniqueImage(name, cityName, country, excludeUrls) {
  const stages = [
    () => searchCommonsByName(name, cityName),
    () => searchWikipediaImage(name, cityName),
    () => searchOpenverse(name, cityName, country),
  ];
  const delays = [COMMONS_SEARCH_DELAY, WIKIPEDIA_DELAY, OPENVERSE_DELAY];

  for (let i = 0; i < stages.length; i++) {
    try {
      const url = await stages[i]();
      await sleep(delays[i]);
      if (url && !excludeUrls.has(url)) return url;
    } catch (e) {
      console.warn(`    image search stage ${i} failed: ${e.message}`);
      await sleep(delays[i]);
    }
  }
  return null;
}
