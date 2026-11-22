import { TripSuggestion } from '../models/ai.model';

/**
 * The option the plan prompt expects, synthesized from picked cities (F84 simple flow).
 * Mirrored byte-for-byte with the backend's `buildCitiesPlanOption` (manager `src/lib/cities-plan-option.ts`);
 * key order matters, both specs pin the same fixture.
 */
export function citiesPlanOption(cities: { id: string; name: string }[], duration: number): TripSuggestion {
  const names = cities.map(c => c.name);
  return {
    id: 0,
    title: `Viaje a ${names.join(', ')}`,
    summary: `Itinerario de ${duration} días por ${names.join(', ')}`,
    highlights: names,
    cityIds: cities.map(c => c.id),
  };
}
