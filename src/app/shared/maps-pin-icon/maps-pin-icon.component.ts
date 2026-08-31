import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Replaces the plain 📍 emoji for every "view this on Google Maps" link
 * (shared-trip itinerary rows, attraction card, attraction detail modal —
 * see docs/superpowers/plans/2026-08-29-family-feedback-round.md Task 3).
 * A single-`currentColor` SVG contrasts consistently against any surrounding
 * text color, unlike the emoji, which read inconsistently small and blended
 * into the text at 12px.
 *
 * NOT used for: the decorative city-country label in DestinationComponent's
 * banner (not a link), the physically-placed pins on the Visited Places map
 * in ProfileComponent (different meaning — a marker, not a "view on maps"
 * action), or DayTimelineComponent's "🗺️ Ruta del día" button (a different
 * feature — a multi-stop route, not a single-place link — and deliberately
 * keeps a different icon so the two are never confused).
 */
@Component({
  selector: 'app-maps-pin-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <svg class="maps-pin-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.44 11.44 6.72 11.7a1.13 1.13 0 0 0 1.56 0c.28-.26 6.72-6.45 6.72-11.7C19.5 5.36 16.14 2 12 2zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5z"/>
    </svg>
  `,
})
export class MapsPinIconComponent {}
