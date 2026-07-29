/**
 * discover-attractions.mjs — OSM Overpass discovery of new, notable POIs
 * for a city, excluding any whose name already exists in that city's
 * curated block. Ported from lib/discover-osm-pois.mjs (root, not visible
 * to the cloud routine) and generalized via geocode-city.mjs instead of a
 * hardcoded coordinate table.
 */
import { geocodeCity } from './geocode-city.mjs';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
export const OVERPASS_RATE_LIMIT_MS = 8000;
const DEFAULT_RADIUS_KM = 10;

const MAPPINGS = [
  { test: t => t.tourism === 'museum' || t.tourism === 'gallery',
    out: { type: 'Museo',     icon: '🖼️', bg: '#E8F0FD', category: 'poi',    score: 8 } },
  { test: t => t.tourism === 'viewpoint',
    out: { type: 'Mirador',   icon: '🌄', bg: '#E8FDE8', category: 'poi',    score: 6 } },
  { test: t => t.tourism === 'theme_park' || t.tourism === 'zoo' || t.tourism === 'aquarium',
    out: { type: 'Atracción', icon: '🎡', bg: '#FDE8F5', category: 'poi',    score: 7 } },
  { test: t => t.amenity === 'marketplace',
    out: { type: 'Mercado',   icon: '🍴', bg: '#FDF5E8', category: 'foodie', score: 7 } },
  { test: t => t.amenity === 'theatre' || t.tourism === 'artwork',
    out: { type: 'Cultural',  icon: '🎭', bg: '#FDE8F5', category: 'poi',    score: 6 } },
  { test: t => t.amenity === 'place_of_worship' || t.building === 'church' || t.historic === 'church',
    out: { type: 'Iglesia',   icon: '⛪', bg: '#E8F0FD', category: 'poi',    score: 7 } },
  { test: t => t.leisure === 'park' || t.leisure === 'garden' || t.boundary === 'national_park',
    out: { type: 'Parque',    icon: '🌿', bg: '#E8FDE8', category: 'poi',    score: 7 } },
  { test: t => t.natural === 'volcano',
    out: { type: 'Volcán',    icon: '🌋', bg: '#E8FDE8', category: 'poi',    score: 8 } },
  { test: t => t.natural === 'peak',
    out: { type: 'Naturaleza',icon: '🏔️', bg: '#E8FDE8', category: 'poi',    score: 4 } },
  { test: t => t.historic === 'castle' || t.historic === 'fort',
    out: { type: 'Histórico', icon: '🏰', bg: '#E8F0FD', category: 'poi',    score: 8 } },
  { test: t => !!t.historic,
    out: { type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', category: 'poi',    score: 7 } },
  { test: t => t.tourism === 'attraction',
    out: { type: 'Atracción', icon: '✨', bg: '#FDE8F5', category: 'poi',    score: 6 } },
];
const DEFAULT_OUT = { type: 'Atracción', icon: '📍', bg: '#E8F0FD', category: 'poi', score: 4 };

function classify(tags) {
  for (const m of MAPPINGS) if (m.test(tags)) return m.out;
  return DEFAULT_OUT;
}

function buildQuery(lat, lng, radiusKm) {
  const r = Math.round(radiusKm * 1000);
  const a = `(around:${r},${lat},${lng})`;
  return `[out:json][timeout:90];
(
  nwr["tourism"~"^(attraction|museum|gallery|viewpoint|artwork|zoo|theme_park|aquarium)$"]${a};
  nwr["historic"~"^(monument|memorial|castle|fort|ruins|archaeological_site|church|building|city_gate)$"]${a};
  nwr["leisure"~"^(park|garden)$"]${a};
  nwr["boundary"="national_park"]${a};
  nwr["amenity"~"^(marketplace|theatre|place_of_worship)$"]${a};
  nwr["natural"~"^(peak|volcano)$"]${a};
);
out center tags;`;
}

async function fetchOverpass(lat, lng, radiusKm) {
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'TravelBestie-attraction-fix-loop/1.0 Node/20',
    },
    body: 'data=' + encodeURIComponent(buildQuery(lat, lng, radiusKm)),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();
  return json.elements ?? [];
}

function isNotable(tags) {
  if (!tags?.name) return false;
  if (tags.wikidata || tags.wikipedia) return true;
  if (['attraction', 'museum', 'gallery', 'zoo', 'theme_park', 'aquarium'].includes(tags.tourism)) return true;
  if (['archaeological_site', 'ruins', 'castle', 'fort'].includes(tags.historic)) return true;
  if (tags.boundary === 'national_park') return true;
  return false;
}

function dedupeByName(entries) {
  const seen = new Map();
  for (const e of entries) {
    const key = e.name.toLowerCase().trim();
    const prev = seen.get(key);
    if (!prev || e._score > prev._score) seen.set(key, e);
  }
  return [...seen.values()];
}

/**
 * Discovers up to `limit` new notable POIs for `city` ({id, name, country}),
 * excluding anything whose name (case-insensitive) is in `existingNames`.
 */
export async function discoverAttractionsForCity(city, existingNames, { radiusKm = DEFAULT_RADIUS_KM, limit = 12 } = {}) {
  const coords = await geocodeCity(city);
  if (!coords) throw new Error(`Could not geocode ${city.name}, ${city.country}`);

  const elements = await fetchOverpass(coords.lat, coords.lng, radiusKm);
  const excludeSet = new Set(existingNames.map(n => n.toLowerCase().trim()));

  const named = elements
    .filter(el => isNotable(el.tags))
    .filter(el => !excludeSet.has(el.tags.name.toLowerCase().trim()))
    .map(el => {
      const tags = el.tags;
      const cls = classify(tags);
      const hasWiki = !!(tags.wikidata || tags.wikipedia);
      return {
        name: tags.name,
        category: cls.category,
        type: cls.type,
        icon: cls.icon,
        bg: cls.bg,
        website: tags.website || tags['contact:website'] || tags.url || null,
        wikidataId: tags.wikidata || null,
        _score: cls.score + (hasWiki ? 5 : 0) + (tags.website ? 1 : 0),
      };
    });

  const TYPE_CAP = 5;
  const sorted = dedupeByName(named).sort((a, b) => b._score - a._score);
  const typeCounts = {};
  const diverse = [];
  for (const e of sorted) {
    if (diverse.length >= limit) break;
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    if (typeCounts[e.type] <= TYPE_CAP) diverse.push(e);
  }
  return diverse;
}
