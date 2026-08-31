import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../api/api.service';
import { WeatherDay } from '../models/weather.model';

interface CachedEntry {
  days: WeatherDay[];
  etag: string;
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly api = inject(ApiService);

  // Keyed `${cityId}:${date}` (date is dd/mm/yyyy) so lookups are O(1) per day-tab
  // regardless of which stop/range originally populated that day.
  private readonly _dayMap = signal<Record<string, WeatherDay>>({});
  readonly dayMap = this._dayMap.asReadonly();

  // Cache keys with a request currently in flight — collapses concurrent duplicate
  // load() calls for the same (cityId, checkIn, checkOut) into one HTTP request
  // (see the note above this code block for why duplicates happen: more than one
  // tb-day-timeline instance can be mounted at once). Cleared once that request
  // settles, so a later, non-concurrent call for the same key still goes through.
  private readonly inFlight = new Set<string>();

  private cacheKey(cityId: string, checkIn: string, checkOut: string): string {
    return `tb:weather:${cityId}:${checkIn}:${checkOut}`;
  }

  private readCache(key: string): CachedEntry | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as CachedEntry) : null;
    } catch { return null; }
  }

  private writeCache(key: string, entry: CachedEntry): void {
    try { localStorage.setItem(key, JSON.stringify(entry)); } catch { /* non-fatal */ }
  }

  /** Fire-and-forget: fetches (or revalidates) weather for a city + date range and
   *  merges the result into dayMap. Safe to call repeatedly, including concurrently
   *  from multiple mounted tb-day-timeline instances for the same combo (see the
   *  in-flight guard above) — a matching cached entry sends If-None-Match and a
   *  304 is a cheap no-op either way. */
  load(cityId: string, checkIn: string, checkOut: string): void {
    const key = this.cacheKey(cityId, checkIn, checkOut);
    if (this.inFlight.has(key)) return;
    this.inFlight.add(key);

    const cached = this.readCache(key);

    this.api.getWeather(cityId, checkIn, checkOut, cached?.etag)
      .pipe(finalize(() => this.inFlight.delete(key)))
      .subscribe({
        next: res => {
          if (res.status === 304) {
            if (cached) this.mergeIntoDayMap(cityId, cached.days);
            return;
          }
          if (res.days && res.etag) {
            this.writeCache(key, { days: res.days, etag: res.etag });
            this.mergeIntoDayMap(cityId, res.days);
          }
        },
        error: () => { /* non-fatal — leave whatever's already in dayMap; chips for
                          this city/range simply stay absent (see DayTimelineComponent's
                          'unavailable'/missing-entry handling in Task 11) */ },
      });
  }

  private mergeIntoDayMap(cityId: string, days: WeatherDay[]): void {
    this._dayMap.update(map => {
      const next = { ...map };
      for (const day of days) next[`${cityId}:${day.date}`] = day;
      return next;
    });
  }

  get(cityId: string, date: string): WeatherDay | null {
    return this._dayMap()[`${cityId}:${date}`] ?? null;
  }
}
