import { signal } from '@angular/core';
import { Attraction } from '../core/models/comment.model';
import { City } from '../core/models/city.model';
import { WORLD_CITIES } from './cities.data';
import { FREETOURS_CURATED } from './freetours-curated';
import { EVENTS_CURATED } from './events-curated';

type Status = 'loading' | 'ready' | 'error';
type Source = (cityId: string) => Attraction[] | undefined;

const KNOWN_IDS = new Set(WORLD_CITIES.map(c => c.id));
// Signals are written only in promise callbacks or event handlers, never during a read (reads may run inside computed()).
const status = signal<Record<string, Status>>({});
const cache = new Map<string, Attraction[]>();
const inFlight = new Map<string, Promise<void>>();
let testSource: Source | null = null;

function ensureLoad(id: string): void {
  if (!KNOWN_IDS.has(id) || cache.has(id) || inFlight.has(id) || status()[id] === 'error') return;
  const req = new Promise<Response>(resolve => resolve(fetch(`/data/attractions/${id}.json`)))
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: unknown = await res.json();
      if (!Array.isArray(body)) throw new Error('not an array');
      cache.set(id, body as Attraction[]);
      status.update(s => ({ ...s, [id]: 'ready' }));
    })
    .catch(() => status.update(s => ({ ...s, [id]: 'error' })))
    .finally(() => inFlight.delete(id));
  inFlight.set(id, req);
}

/** Raw curated entries (active and inactive) for a city, or undefined while it loads. Starts the load on a miss. */
function curatedFor(cityId: string): Attraction[] | undefined {
  if (!KNOWN_IDS.has(cityId)) return undefined;
  if (testSource) return testSource(cityId) ?? [];
  status(); // tracked so computed() re-runs when the file arrives
  ensureLoad(cityId);
  return cache.get(cityId);
}

/** Drops any non-https photo URL (mixed-content safety — production is HTTPS-only). */
export function stripInsecureImages(a: Attraction): Attraction {
  return {
    ...a,
    imageUrl: a.imageUrl?.startsWith('http://') ? undefined : a.imageUrl,
    images: a.images?.filter(u => !u.startsWith('http://')),
  };
}

export function getAttractions(city: City): Attraction[] {
  const curated = curatedFor(city.id);
  if (!curated) return [];

  let base = curated.filter(a => a.active).map(stripInsecureImages);

  const freetours = FREETOURS_CURATED[city.id];
  if (freetours?.length) base = [...base, ...freetours];

  const events = EVENTS_CURATED[city.id];
  if (events?.length) base = [...base, ...events];

  return base;
}

/** Returns an attraction by id regardless of its active flag — use when rendering existing trip stops. */
export function findCuratedAttraction(cityId: string, attractionId: string): Attraction | undefined {
  if (!KNOWN_IDS.has(cityId)) return undefined;
  return curatedFor(cityId)?.find(a => a.id === attractionId)
    ?? FREETOURS_CURATED[cityId]?.find(a => a.id === attractionId)
    ?? EVENTS_CURATED[cityId]?.find(a => a.id === attractionId);
}

export function attractionsStatus(cityId: string): Status {
  if (testSource || !KNOWN_IDS.has(cityId)) return 'ready';
  ensureLoad(cityId); // a status-only caller still starts the fetch (no signal write here)
  return status()[cityId] ?? 'loading';
}

export async function loadCityAttractions(cityIds: readonly string[]): Promise<void> {
  // One-shot user actions (export, AI, companion) get a fresh attempt for errored cities; reads never do.
  cityIds.forEach(id => retryCityAttractions(id));
  await Promise.all(cityIds.map(id => inFlight.get(id)));
}

export function retryCityAttractions(cityId: string): void {
  status.update(s => {
    if (s[cityId] !== 'error') return s;
    const { [cityId]: _failed, ...rest } = s;
    return rest;
  });
  ensureLoad(cityId);
}

/** Test hook: a sync source replaces fetching. Passing null restores real loading and clears all store state. */
export function __setAttractionSourceForTests(source: Source | null): void {
  testSource = source;
  status.set({});
  cache.clear();
  inFlight.clear();
}
