// IMPORT-FREE on purpose (see guide-quality.util.ts). Single source of the guide <title>/description strings:
// used by the Angular page AND the build-time static head (scripts/city-pages.mjs) so they can never drift.
export interface GuideSight {
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

export function guideTitle(displayName: string): string {
  const full = `Qué hacer en ${displayName}: guía de viaje desde Chile | Tripilove`;
  return full.length <= 60 ? full : `Qué hacer en ${displayName}: guía de viaje | Tripilove`;
}

export function guideDescription(displayName: string, sightCount: number): string {
  const d = `Guía de ${displayName}: ${sightCount} lugares para visitar, excursiones, visa, moneda y consejos para viajar desde Chile.`;
  return d.length <= 155 ? d : `${d.slice(0, 154).replace(/\s+\S*$/, '')}…`;
}

/** Active, described, non-day-trip sights, best first (rating desc, then name) — the "imperdibles" and the JSON-LD list. */
export function pickTopSights<T extends GuideSight>(attractions: T[], n: number): T[] {
  return attractions
    .filter(a => a.active && !a.dayTrip && (a.description ?? '').length > 0)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, n);
}
