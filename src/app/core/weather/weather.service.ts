import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../api/api.service';
import { WeatherDay } from '../models/weather.model';

interface CachedEntry {
  days: WeatherDay[];
  etag: string;
  cachedAt: number;
}

const CACHE_PREFIX = 'tb:weather:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

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
    return `${CACHE_PREFIX}${cityId}:${checkIn}:${checkOut}`;
  }

  private readCache(key: string): CachedEntry | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as CachedEntry) : null;
    } catch { return null; }
  }

  private writeCache(key: string, entry: Omit<CachedEntry, 'cachedAt'>): void {
    try {
      localStorage.setItem(key, JSON.stringify({ ...entry, cachedAt: Date.now() }));
    } catch { /* non-fatal */ }
    this.pruneCache();
  }

  /** Bounds the weather cache's contribution to the shared localStorage origin
   *  quota: every date edit on a stop mints a brand-new key
   *  (`tb:weather:{cityId}:{checkIn}:{checkOut}`) with no natural eviction, so
   *  this drops entries older than CACHE_TTL_MS and, if still over
   *  MAX_CACHE_ENTRIES, the oldest survivors until back at the cap. Runs after
   *  every cache write. Non-fatal — localStorage access can throw in some
   *  browser contexts (matching this file's existing convention). */
  private pruneCache(): void {
    try {
      const survivors: { key: string; cachedAt: number }[] = [];
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(CACHE_PREFIX)) continue;

        const entry = this.readCache(key);
        if (!entry || now - entry.cachedAt > CACHE_TTL_MS) {
          localStorage.removeItem(key);
          continue;
        }
        survivors.push({ key, cachedAt: entry.cachedAt });
      }

      if (survivors.length > MAX_CACHE_ENTRIES) {
        survivors.sort((a, b) => a.cachedAt - b.cachedAt);
        const excess = survivors.length - MAX_CACHE_ENTRIES;
        for (let i = 0; i < excess; i++) localStorage.removeItem(survivors[i].key);
      }
    } catch { /* non-fatal */ }
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
          if (res.days) {
            // A missing etag (e.g. the backend didn't expose it cross-origin via
            // Access-Control-Expose-Headers) must not block showing the data — it only
            // means this response can't be cached for future revalidation.
            if (res.etag) this.writeCache(key, { days: res.days, etag: res.etag });
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
