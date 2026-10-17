import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { isGuideAttraction } from '../seo/city-guide-seo.util';

/** /preferences backdrop and the fallback when the planned cities have no curated photos. */
export const ICONIC_BACKDROP_CITIES = ['paris', 'rome', 'cusco', 'rio', 'tokyo', 'barcelona', 'london'];
export const BACKDROP_ROTATE_MS = 10_000;
const PER_CITY = 2;

/** Top-rated sight photos (same "sight" rule as the city guides: active, no events/freetours), https only (CSP). */
function cityImages(cityId: string): string[] {
  const city = WORLD_CITIES.find(c => c.id === cityId);
  if (!city) return [];
  return getAttractions(city)
    .filter(a => isGuideAttraction(a) && a.imageUrl?.startsWith('https://'))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, PER_CITY)
    .map(a => a.imageUrl!);
}

/** Top-rated photos per city, interleaved across cities (so 3 cities don't show 2 Paris shots in a row). */
export function backdropImages(cityIds: string[], max = 6): string[] {
  const perCity = cityIds.map(cityImages).filter(l => l.length);
  if (!perCity.length) return cityIds === ICONIC_BACKDROP_CITIES ? [] : backdropImages(ICONIC_BACKDROP_CITIES, max);
  const out: string[] = [];
  for (let i = 0; out.length < max && perCity.some(l => i < l.length); i++)
    for (const l of perCity) if (l[i] && !out.includes(l[i]) && out.length < max) out.push(l[i]);
  return out;
}
