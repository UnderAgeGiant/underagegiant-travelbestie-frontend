import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AttractionCatalogService } from './attraction-catalog.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { KarmaService } from '../karma/karma.service';
import { AuthService } from '../auth/auth.service';
import { TripService } from '../../features/trip/trip.service';
import { CompanionSuggestion } from '../models/ai.model';
import { findCuratedAttraction } from '../../data/attractions.data';

export type CompanionState = 'idle' | 'sniffing' | 'suggesting';

export interface AddedAttractionInfo {
  name: string;
  date: string;
  time: string;
}

// The "sniff" state is a deliberate pace-setter, not a loading indicator — the
// suggestion is already known and stored the instant the 200 arrives, but the
// mascot always visibly "searches" for a beat before the bubble pops in.
const SUGGESTION_REVEAL_DELAY_MS = 2500;

@Injectable({ providedIn: 'root' })
export class CompanionSuggestionService {
  private readonly api        = inject(ApiService);
  private readonly catalog    = inject(AttractionCatalogService);
  private readonly karmaModal = inject(KarmaModalService);
  private readonly karma      = inject(KarmaService);
  private readonly auth       = inject(AuthService);
  private readonly trip       = inject(TripService);

  private revealTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _state              = signal<CompanionState>('idle');
  private readonly _addedAttractionInfo = signal<AddedAttractionInfo | null>(null);
  private readonly _suggestion         = signal<CompanionSuggestion | null>(null);
  private readonly _cityId             = signal<string | null>(null);
  private readonly _stopId             = signal<string | null>(null);
  // Epoch ms the current boost expires at, or null when not boosted. This is the raw
  // value CompanionBoostCardComponent (Task 13) ticks its own countdown against —
  // it is NOT re-derived from wall-clock time here, so it never goes stale on its own;
  // the component compares it to a locally-ticking `now` signal for the live display.
  private readonly _boostExpiresAt     = signal<number | null>(null);
  // Increments each time boost() itself succeeds (never on refreshBoostStatus()'s
  // page-load/login discovery of an already-active boost). CompanionBoostCardComponent
  // watches this to fire a one-time celebration effect only right after a purchase,
  // not every time the card happens to render in a boosted state.
  private readonly _boostJustPurchased = signal(0);

  readonly state               = this._state.asReadonly();
  readonly addedAttractionInfo = this._addedAttractionInfo.asReadonly();
  readonly suggestion          = this._suggestion.asReadonly();
  readonly cityId               = this._cityId.asReadonly(); // exposed so CompanionMascotComponent (Task 11) can resolve the suggested attraction's name/icon
  readonly boostExpiresAt      = this._boostExpiresAt.asReadonly();
  readonly boosted             = computed(() => this._boostExpiresAt() !== null);
  readonly boostJustPurchased  = this._boostJustPurchased.asReadonly();

  /** Refreshes the boost flag + expiry from the backend. Call on app init (if a
   *  session may exist) and right after a successful login/register. No-ops (and
   *  clears the local flag) when the user isn't logged in — never fires a request. */
  refreshBoostStatus(): void {
    if (!this.auth.isLoggedIn()) { this._boostExpiresAt.set(null); return; }
    this.api.getCompanionStatus().subscribe({
      next: res => this._boostExpiresAt.set(res.boosted ? Date.now() + res.secondsRemaining * 1000 : null),
      error: () => this._boostExpiresAt.set(null),
    });
  }

  /** Fire-and-forget: call once, right after TripService.addAttraction() adds ONE
   *  attraction via a direct user action (attraction card / detail modal). Never
   *  call this from a loop that adds several attractions at once (e.g. Feature 52's
   *  CitySuggestService.addAll) — that would stack several mascot popups.
   *
   *  Silent by design: a fresh trigger's network round trip never shows a loading
   *  state — the mascot never appears at all for a 204 (dice-roll miss / invalid
   *  suggestion) or a network error. Only on a 200 does anything become visible —
   *  and even then, the suggestion is fetched and stored immediately but held back
   *  behind a fixed SUGGESTION_REVEAL_DELAY_MS 'sniffing' beat before flipping to
   *  'suggesting'.
   *
   *  Does NOT wait for state to be 'idle' before starting — if the user adds another
   *  attraction while a previous suggestion is still being shown (sniffing or
   *  suggesting), this simply overwrites it once the new response arrives, rather
   *  than being dropped. A 204/error from the new call leaves whatever is currently
   *  displayed untouched. */
  async trigger(stopId: string, attractionId: string): Promise<void> {
    if (!this.auth.isLoggedIn()) return;

    const stop = this.trip.stops().find(s => s.stopId === stopId);
    if (!stop) return;

    const entry = stop.selectedAttractions.find(a => a.attractionId === attractionId);
    const attraction = findCuratedAttraction(stop.cityId, attractionId);

    const existingAttractionIds = stop.selectedAttractions.map(a => a.attractionId);
    const existingSchedule = stop.selectedAttractions.flatMap(a =>
      a.date && a.startTime && a.endTime ? [{ date: a.date, startTime: a.startTime, endTime: a.endTime }] : [],
    );
    const departureTimes = this.trip.transits()
      .filter(t => t.fromCityId === stop.cityId && t.segments.length > 0)
      .map(t => ({ date: t.segments[0].departureDate, time: t.segments[0].departureTime }));

    const catalogMap  = await this.catalog.getCityCatalog([stop.cityId]);
    const cityCatalog = catalogMap[stop.cityId] ?? [];

    return new Promise<void>(resolve => {
      this.api.suggestCompanion(
        stop.cityId, attractionId, stop.checkIn, stop.checkOut,
        existingAttractionIds, cityCatalog, existingSchedule, departureTimes,
      ).subscribe({
        next: res => {
          if (!res) { resolve(); return; } // no suggestion — leaves whatever is currently shown (if anything) untouched

          // Overwrite case: a previous suggestion may still be sniffing/showing —
          // clear its pending reveal timer before replacing it with the new one.
          if (this.revealTimer) { clearTimeout(this.revealTimer); this.revealTimer = null; }

          this._addedAttractionInfo.set({
            name: attraction?.name ?? attractionId,
            date: entry?.date ?? stop.checkIn,
            time: entry?.startTime ?? '',
          });
          this._cityId.set(stop.cityId);
          this._stopId.set(stopId);
          this._suggestion.set(res);
          this._state.set('sniffing'); // the response is already known — this is a deliberate pace-setter, not a spinner

          this.revealTimer = setTimeout(() => {
            this.revealTimer = null;
            this._state.set('suggesting');
          }, SUGGESTION_REVEAL_DELAY_MS);

          resolve();
        },
        error: () => { resolve(); }, // request failed — stays silently idle
      });
    });
  }

  /** Adds the current suggestion directly via TripService.addAttraction — never
   *  through trigger(), so accepting a suggestion never re-triggers the mascot. */
  accept(): void {
    const suggestion = this._suggestion();
    const stopId = this._stopId();
    const cityId = this._cityId();
    if (!suggestion || !stopId || !cityId) { this.dismiss(); return; }
    const attraction = findCuratedAttraction(cityId, suggestion.attractionId);
    this.trip.addAttraction(stopId, suggestion.attractionId, suggestion.startTime, suggestion.date, attraction?.category);
    this.dismiss();
  }

  dismiss(): void {
    if (this.revealTimer) { clearTimeout(this.revealTimer); this.revealTimer = null; }
    this._state.set('idle');
    this._suggestion.set(null);
    this._addedAttractionInfo.set(null);
    this._cityId.set(null);
    this._stopId.set(null);
  }

  boost(): void {
    this.api.boostCompanion().subscribe({
      next: res => {
        this._boostExpiresAt.set(Date.now() + res.secondsRemaining * 1000);
        this.karma.spend();
        this._boostJustPurchased.update(n => n + 1);
      },
      error: err => { this.karmaModal.handleKarmaError(err); },
    });
  }

  /** Called on logout — mirrors KarmaService.clear() / FavoritesService.clear(). */
  clear(): void {
    this._boostExpiresAt.set(null);
    this.dismiss();
  }
}
