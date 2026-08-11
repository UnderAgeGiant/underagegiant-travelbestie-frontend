import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AttractionCatalogService } from './attraction-catalog.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { TripService } from '../../features/trip/trip.service';
import { TripStop } from '../models/trip.model';
import { CityAttractionSuggestion } from '../models/ai.model';
import { findCuratedAttraction } from '../../data/attractions.data';

@Injectable({ providedIn: 'root' })
export class CitySuggestService {
  private readonly api        = inject(ApiService);
  private readonly catalog    = inject(AttractionCatalogService);
  private readonly karmaModal = inject(KarmaModalService);
  private readonly trip       = inject(TripService);

  private readonly _openForStopId = signal<string | null>(null);
  private readonly _loading       = signal(false);
  private readonly _suggestions   = signal<CityAttractionSuggestion[]>([]);
  private readonly _error         = signal<string | null>(null);

  readonly openForStopId = this._openForStopId.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly suggestions   = this._suggestions.asReadonly();
  readonly error         = this._error.asReadonly();

  /** Opens the cloud for `stop` immediately (loading state), then fetches suggestions. Costs karma. */
  async request(stop: TripStop): Promise<void> {
    this._openForStopId.set(stop.stopId);
    await this.fetchSuggestions(stop, stop.selectedAttractions.map(a => a.attractionId), false);
  }

  /**
   * Re-requests suggestions for the stop the cloud is already open for, without closing it.
   * Excludes both already-planned attractions and the batch just shown, so DeepSeek doesn't
   * repeat itself. Sent with isFollowUp: true so the backend treats it as free — only the
   * first suggestion request per stop-card click costs karma.
   */
  async searchMore(stop: TripStop): Promise<void> {
    const excludeIds = [
      ...stop.selectedAttractions.map(a => a.attractionId),
      ...this._suggestions().map(s => s.attractionId),
    ];
    await this.fetchSuggestions(stop, excludeIds, true);
  }

  private async fetchSuggestions(stop: TripStop, existingAttractionIds: string[], isFollowUp: boolean): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._suggestions.set([]);

    const catalogMap  = await this.catalog.getCityCatalog([stop.cityId]);
    const cityCatalog = catalogMap[stop.cityId] ?? [];

    const existingSchedule = stop.selectedAttractions.flatMap(a =>
      a.date && a.startTime && a.endTime ? [{ date: a.date, startTime: a.startTime, endTime: a.endTime }] : [],
    );
    const departureTimes = this.trip.transits()
      .filter(t => t.fromCityId === stop.cityId && t.segments.length > 0)
      .map(t => ({ date: t.segments[0].departureDate, time: t.segments[0].departureTime }));

    this.api.suggestCityAttractions(
      stop.cityId, stop.checkIn, stop.checkOut, existingAttractionIds, cityCatalog, isFollowUp,
      existingSchedule, departureTimes,
    ).subscribe({
        next: res => {
          this._loading.set(false);
          this._suggestions.set(res.suggestions);
        },
        error: err => {
          this._loading.set(false);
          if (this.karmaModal.handleKarmaError(err)) {
            this._openForStopId.set(null);
          } else {
            this._error.set('No pudimos generar sugerencias. Intenta de nuevo.');
          }
        },
      });
  }

  /** Adds only the selected suggestions to the stop via the existing TripService.addAttraction, then closes. */
  addAll(stopId: string, cityId: string, selectedAttractionIds: string[]): void {
    for (const s of this._suggestions()) {
      if (!selectedAttractionIds.includes(s.attractionId)) continue;
      const attraction = findCuratedAttraction(cityId, s.attractionId);
      this.trip.addAttraction(stopId, s.attractionId, s.startTime, s.date, attraction?.category, attraction?.estimatedMinutes);
    }
    this.close();
  }

  close(): void {
    this._openForStopId.set(null);
    this._suggestions.set([]);
    this._error.set(null);
  }
}
