/**
 * geocode-city.mjs — Nominatim forward geocoding with a persistent,
 * git-committed cache (scripts/city-coords-cache.json). Must stay under
 * Nominatim's usage policy: max 1 request/second, identifying User-Agent.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, 'city-coords-cache.json');

function loadCache() {
  return existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
}
function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** city: { id, name, country } → { lat, lng } | null */
export async function geocodeCity(city) {
  const cache = loadCache();
  if (cache[city.id]) return cache[city.id];

  const q = new URLSearchParams({
    city: city.name,
    country: city.country,
    format: 'json',
    limit: '1',
    'accept-language': 'en',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
    headers: { 'User-Agent': 'TravelBestie-attraction-fix-loop/1.0 (matias.fuentes.perez@gmail.com)' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} for ${city.id}`);
  const data = await res.json();
  await sleep(1100); // Nominatim usage policy: max 1 req/s

  if (!data[0]) return null;
  const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  cache[city.id] = coords;
  saveCache(cache);
  return coords;
}
