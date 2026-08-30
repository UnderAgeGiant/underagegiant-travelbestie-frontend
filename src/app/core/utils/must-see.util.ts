/**
 * "Imperdible" (must-see) heuristic — family feedback idea #4
 * (docs/superpowers/plans/2026-08-29-family-feedback-round.md Task 5).
 * Deliberately reuses the `rating` every curated attraction already carries
 * instead of adding a new curated data field or pipeline step.
 */
export const MUST_SEE_RATING_THRESHOLD = 4.5;

export function isMustSeeAttraction(attraction: { rating: number }): boolean {
  return attraction.rating >= MUST_SEE_RATING_THRESHOLD;
}

/** Stable sort: must-see attractions first; original relative order preserved within each group. */
export function sortMustSeeFirst<T extends { rating: number }>(attractions: T[]): T[] {
  return [...attractions].sort((a, b) => Number(isMustSeeAttraction(b)) - Number(isMustSeeAttraction(a)));
}
