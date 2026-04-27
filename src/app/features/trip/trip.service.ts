import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { City } from '../../core/models/city.model';
import { TripStop, PlannedAttraction, Planification, TransitLeg, Lodging } from '../../core/models/trip.model';
import { AuthService } from '../../core/auth/auth.service';

function migrateTransitLeg(raw: any): TransitLeg {
  if (raw && Array.isArray(raw.segments)) {
    // Ensure every segment has the new fields (in case they were saved before this model change)
    const segments = raw.segments.map((s: any) => ({
      mode:            s.mode ?? 'flight',
      departureDate:   s.departureDate ?? '',
      departureTime:   s.departureTime ?? '',
      arrivalDate:     s.arrivalDate ?? '',
      arrivalTime:     s.arrivalTime ?? '',
      notes:           s.notes ?? '',
      durationMinutes: s.durationMinutes,
    }));
    return { ...raw, segments };
  }
  return {
    fromCityId: raw.fromCityId,
    toCityId:   raw.toCityId,
    segments: [{
      mode:           raw.mode ?? 'flight',
      departureDate:  '',
      departureTime:  '',
      arrivalDate:    '',
      arrivalTime:    '',
      notes:          raw.notes ?? '',
      durationMinutes: raw.durationMinutes ?? 0,
    }],
  };
}

const planKey       = (email: string) => `tb_plan_${email}`;
const activePlanKey = (email: string) => `tb_active_plan_${email}`;

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly auth = inject(AuthService);

  private _stops        = signal<TripStop[]>([]);
  private _transits     = signal<TransitLeg[]>([]);
  private _activeId     = signal<string | null>(null);
  private _loadedPlanId = signal<string | null>(null);
  private _saving       = false;

  readonly stops        = this._stops.asReadonly();
  readonly transits     = this._transits.asReadonly();
  readonly activeId     = this._activeId.asReadonly();
  readonly loadedPlanId = this._loadedPlanId.asReadonly();
  readonly existingCityIds = computed(() => this._stops().map(s => s.cityId));
  readonly activeStop      = computed(() => this._stops().find(s => s.cityId === this._activeId()) ?? null);

  readonly transitMap = computed(() => {
    const map = new Map<string, TransitLeg>();
    for (const t of this._transits()) {
      map.set(`${t.fromCityId}|${t.toCityId}`, t);
    }
    return map;
  });

  readonly planification = computed((): Planification | null => {
    const stops = this._stops();
    if (stops.length === 0) return null;
    return {
      stops,
      totalAttractions: stops.reduce((sum, s) => sum + s.selectedAttractions.length, 0),
    };
  });

  constructor() {
    // Restore plan synchronously if user is already logged in (page refresh)
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);

    // Auto-save on every stops/transits/loadedPlanId mutation (skip during bulk restore)
    effect(() => {
      const user     = this.auth.currentUser();
      const stops    = this._stops();
      const transits = this._transits();
      const loadedId = this._loadedPlanId();
      if (user?.email && !this._saving) {
        localStorage.setItem(planKey(user.email), JSON.stringify({ stops, transits }));
        if (loadedId) {
          localStorage.setItem(activePlanKey(user.email), loadedId);
        } else {
          localStorage.removeItem(activePlanKey(user.email));
        }
      }
    });
  }

  /** Load the saved plan for a user and enable auto-save. */
  loadForUser(email: string): void {
    this._saving = true;
    const raw      = localStorage.getItem(planKey(email));
    const activeId = localStorage.getItem(activePlanKey(email));
    if (raw) {
      try {
        const parsed   = JSON.parse(raw);
        const stops: TripStop[]     = Array.isArray(parsed) ? parsed : (parsed.stops    ?? []);
        const transits: TransitLeg[] = Array.isArray(parsed) ? []     : (parsed.transits ?? []).map(migrateTransitLeg);
        this._stops.set(stops);
        this._transits.set(transits);
        this._activeId.set(stops[0]?.cityId ?? null);
      } catch {
        this._stops.set([]);
        this._transits.set([]);
        this._activeId.set(null);
      }
    } else {
      this._stops.set([]);
      this._transits.set([]);
      this._activeId.set(null);
    }
    this._loadedPlanId.set(activeId ?? null);
    this._saving = false;
  }

  /** Wipe in-memory plan without touching localStorage (called on logout). */
  clearPlan(): void {
    this._saving = true;
    this._stops.set([]);
    this._transits.set([]);
    this._activeId.set(null);
    this._loadedPlanId.set(null);
    this._saving = false;
  }

  /** Load a named saved plan as the active working plan. */
  restoreStops(stops: TripStop[], planId: string | null = null, transits: TransitLeg[] = []): void {
    this._saving = true;
    this._stops.set(stops);
    this._transits.set(transits.map(migrateTransitLeg));
    this._activeId.set(stops[0]?.cityId ?? null);
    this._loadedPlanId.set(planId);
    this._saving = false;
  }

  /** Update which saved-plan id is currently active (called after upsert). */
  markAsLoadedPlan(id: string | null): void {
    this._loadedPlanId.set(id);
  }

  addStop(city: City, checkIn: string, checkOut: string): void {
    this._stops.update(prev =>
      this.sortByCheckIn([...prev, { cityId: city.id, checkIn, checkOut, selectedAttractions: [] }])
    );
    this._activeId.set(city.id);
  }

  updateDates(cityId: string, checkIn: string, checkOut: string): void {
    this._stops.update(stops =>
      this.sortByCheckIn(stops.map(s => s.cityId === cityId ? { ...s, checkIn, checkOut } : s))
    );
  }

  private sortByCheckIn(stops: TripStop[]): TripStop[] {
    return [...stops].sort((a, b) => {
      const ta = this.parseDateMs(a.checkIn);
      const tb = this.parseDateMs(b.checkIn);
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta - tb;
    });
  }

  private parseDateMs(s: string): number | null {
    if (!s) return null;
    const [dd, mm, yyyy] = s.split('/').map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd).getTime();
  }

  removeStop(cityId: string): void {
    const remaining = this._stops().filter(s => s.cityId !== cityId);
    this._stops.set(remaining);
    this._transits.update(ts => ts.filter(t => t.fromCityId !== cityId && t.toCityId !== cityId));
    if (this._activeId() === cityId) {
      this._activeId.set(remaining[0]?.cityId ?? null);
    }
  }

  setLodging(cityId: string, lodging: Lodging): void {
    this._stops.update(stops => stops.map(s => s.cityId === cityId ? { ...s, lodging } : s));
  }

  removeLodging(cityId: string): void {
    this._stops.update(stops => stops.map(s => s.cityId === cityId ? { ...s, lodging: undefined } : s));
  }

  setTransit(leg: TransitLeg): void {
    this._transits.update(ts => {
      const without = ts.filter(t => !(t.fromCityId === leg.fromCityId && t.toCityId === leg.toCityId));
      return [...without, leg];
    });
  }

  removeTransit(fromCityId: string, toCityId: string): void {
    this._transits.update(ts => ts.filter(t => !(t.fromCityId === fromCityId && t.toCityId === toCityId)));
  }

  setActive(cityId: string): void {
    this._activeId.set(cityId);
  }

  addAttraction(cityId: string, attractionId: string, startTime: string, date?: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId && !s.selectedAttractions.some(a => a.attractionId === attractionId)
        ? { ...s, selectedAttractions: [...s.selectedAttractions, { attractionId, startTime, date }] }
        : s
    ));
  }

  removeAttraction(cityId: string, attractionId: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId
        ? { ...s, selectedAttractions: s.selectedAttractions.filter(a => a.attractionId !== attractionId) }
        : s
    ));
  }

  updateStartTime(cityId: string, attractionId: string, startTime: string, date?: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId
        ? { ...s, selectedAttractions: s.selectedAttractions.map(a =>
            a.attractionId === attractionId
              ? { ...a, startTime, date: date ?? a.date }
              : a
          )}
        : s
    ));
  }

  isAttractionSelected(cityId: string, attractionId: string): boolean {
    return this._stops().find(s => s.cityId === cityId)
      ?.selectedAttractions.some(a => a.attractionId === attractionId) ?? false;
  }

  getPlannedAttraction(cityId: string, attractionId: string): PlannedAttraction | null {
    return this._stops().find(s => s.cityId === cityId)
      ?.selectedAttractions.find(a => a.attractionId === attractionId) ?? null;
  }

  selectedAttractionsFor(cityId: string): PlannedAttraction[] {
    return this._stops().find(s => s.cityId === cityId)?.selectedAttractions ?? [];
  }
}
