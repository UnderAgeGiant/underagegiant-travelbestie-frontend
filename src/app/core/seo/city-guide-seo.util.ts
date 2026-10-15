// IMPORT-FREE on purpose (see guide-quality.util.ts). Single source of the guide <title>/description strings:
// used by the Angular page AND the build-time static head (scripts/city-pages.mjs) so they can never drift.
export interface GuideSight {
  id?: string;
  active: boolean;
  name: string;
  rating: number;
  dayTrip?: boolean;
  description?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}

export const guidePath = (slug: string): string => `/ciudad/${slug}`;

/** What a guide counts as an attraction: active, and not a dated event or a Civitatis freetour. */
export function isGuideAttraction(a: { active: boolean; category?: string }): boolean {
  return a.active && a.category !== 'event_party' && a.category !== 'freetour';
}

export function guideTitle(displayName: string, domestic = false): string {
  const short = `Qué hacer en ${displayName}: guía de viaje | Tripilove`;
  if (domestic) return short;
  const full = `Qué hacer en ${displayName}: guía de viaje desde Chile | Tripilove`;
  return full.length <= 60 ? full : short;
}

export function guideDescription(displayName: string, sightCount: number, domestic = false): string {
  const d = domestic
    ? `Guía de ${displayName}: ${sightCount} lugares para visitar, excursiones, cómo llegar y consejos prácticos.`
    : `Guía de ${displayName}: ${sightCount} lugares para visitar, excursiones, visa, moneda y consejos para viajar desde Chile.`;
  return d.length <= 155 ? d : `${d.slice(0, 154).replace(/\s+\S*$/, '')}…`;
}

/**
 * Active, described sights, best first: the "imperdibles" and the JSON-LD list.
 * `pinnedIds` (a guide's mustSeeDayTrips) come first in that order and may be day trips;
 * missing/inactive/undescribed ids are skipped. Then non-day-trip sights by rating desc, then name.
 */
export function pickTopSights<T extends GuideSight>(attractions: T[], n: number, pinnedIds: readonly string[] = []): T[] {
  const usable = (a: T) => a.active && (a.description ?? '').length > 0;
  const pinned = pinnedIds
    .map(id => attractions.find(a => a.id === id))
    .filter((a, i, arr): a is T => !!a && usable(a) && arr.indexOf(a) === i);
  const ranked = attractions
    .filter(a => usable(a) && !a.dayTrip && !pinned.includes(a))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  return [...pinned, ...ranked].slice(0, n);
}
