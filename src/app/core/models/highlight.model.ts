/** New highlight tours are pure data (see highlight-tours.config.ts) — add the id here too so the type stays a closed union. */
export type HighlightType = 'landing_welcome' | 'public_profile_intro';

export interface HighlightStatus {
  seen: boolean;
}
