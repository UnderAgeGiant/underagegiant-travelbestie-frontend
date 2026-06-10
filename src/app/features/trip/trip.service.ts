import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { City } from '../../core/models/city.model';
import { TripStop, PlannedAttraction, Planification, TransitLeg, Lodging } from '../../core/models/trip.model';
import { AuthService } from '../../core/auth/auth.service';

function migrateAttraction(raw: any): PlannedAttraction {
  return {
    entryId:      raw.entryId ?? crypto.randomUUID(),
    attractionId: raw.attractionId,
    startTime:    raw.startTime ?? null,
    endTime:      raw.endTime   ?? null,
    date:         raw.date,
  };
}

function migrateStop(raw: any): TripStop {
  return {
    ...raw,
    stopId:               raw.stopId ?? crypto.randomUUID(),
    selectedAttractions:  (raw.selectedAttractions ?? []).map(migrateAttraction),
  };
}

function migrateTransitLeg(raw: any): TransitLeg {
  if (raw && Array.isArray(raw.segments)) {
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

  private _stops             = signal<TripStop[]>([]);
  private _transits          = signal<TransitLeg[]>([]);
  private _activeId          = signal<string | null>(null);  // tracks stopId
  private _loadedPlanId      = signal<string | null>(null);
  private _selectedTransitId = signal<string | null>(null);
  private _saving            = false;

  readonly stops             = this._stops.asReadonly();
  readonly transits          = this._transits.asReadonly();
  readonly activeId          = this._activeId.asReadonly();
  readonly loadedPlanId      = this._loadedPlanId.asReadonly();
  readonly selectedTransitId = this._selectedTransitId.asReadonly();
  readonly existingCityIds   = computed(() => this._stops().map(s => s.cityId));
  readonly activeStop        = computed(() => this._stops().find(s => s.stopId === this._activeId()) ?? null);

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
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);

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

  loadForUser(email: string): void {
    this._saving = true;
    const raw      = localStorage.getItem(planKey(email));
    const activeId = localStorage.getItem(activePlanKey(email));
    if (raw) {
      try {
        const parsed   = JSON.parse(raw);
        const stops: TripStop[]      = (Array.isArray(parsed) ? parsed : (parsed.stops ?? [])).map(migrateStop);
        const transits: TransitLeg[] = Array.isArray(parsed) ? []     : (parsed.transits ?? []).map(migrateTransitLeg);
        this._stops.set(stops);
        this._transits.set(transits);
        this._activeId.set(stops[0]?.stopId ?? null);
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

  loadForUserPreservingAnonymous(email: string): void {
    const preStops    = this._stops();
    const preTransits = this._transits();
    this.loadForUser(email);
    if (this._stops().length === 0 && preStops.length > 0) {
      this.restoreStops(preStops, null, preTransits);
    }
  }

  persistNow(email: string): void {
    localStorage.setItem(planKey(email), JSON.stringify({ stops: this._stops(), transits: this._transits() }));
    const id = this._loadedPlanId();
    if (id) { localStorage.setItem(activePlanKey(email), id); }
    else     { localStorage.removeItem(activePlanKey(email)); }
  }

  clearPlan(): void {
    this._saving = true;
    this._stops.set([]);
    this._transits.set([]);
    this._activeId.set(null);
    this._loadedPlanId.set(null);
    this._saving = false;
  }

  restoreStops(stops: TripStop[], planId: string | null = null, transits: TransitLeg[] = []): void {
    this._saving = true;
    this._stops.set(stops.map(migrateStop));
    this._transits.set(transits.map(migrateTransitLeg));
    this._activeId.set(stops[0]?.stopId ?? null);
    this._loadedPlanId.set(planId);
    this._saving = false;
  }

  markAsLoadedPlan(id: string | null): void {
    this._loadedPlanId.set(id);
  }

  addStop(city: City, checkIn: string, checkOut: string): void {
    const stopId = crypto.randomUUID();
    this._stops.update(prev =>
      this.sortByCheckIn([...prev, { stopId, cityId: city.id, checkIn, checkOut, selectedAttractions: [] }])
    );
    this._activeId.set(stopId);
  }

  updateDates(stopId: string, checkIn: string, checkOut: string): void {
    this._stops.update(stops =>
      this.sortByCheckIn(stops.map(s => s.stopId === stopId ? { ...s, checkIn, checkOut } : s))
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

  removeStop(stopId: string): void {
    const all  = this._stops();
    const stop = all.find(s => s.stopId === stopId);
    const remaining = all.filter(s => s.stopId !== stopId);
    this._stops.set(remaining);
    // Remove transits for this city only if no other stop for this city remains
    if (stop && !remaining.some(s => s.cityId === stop.cityId)) {
      this._transits.update(ts => ts.filter(t => t.fromCityId !== stop.cityId && t.toCityId !== stop.cityId));
    }
    if (this._activeId() === stopId) {
      this._activeId.set(remaining[0]?.stopId ?? null);
    }
  }

  setLodging(stopId: string, lodging: Lodging): void {
    this._stops.update(stops => stops.map(s => s.stopId === stopId ? { ...s, lodging } : s));
  }

  removeLodging(stopId: string): void {
    this._stops.update(stops => stops.map(s => s.stopId === stopId ? { ...s, lodging: undefined } : s));
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

  setActive(stopId: string): void {
    this._activeId.set(stopId);
    this._selectedTransitId.set(null);
  }

  selectTransit(transitId: string | null): void {
    this._selectedTransitId.set(transitId);
    if (transitId !== null) {
      this._activeId.set(null);
    }
  }

  addAttraction(stopId: string, attractionId: string, startTime: string, date?: string): void {
    const entryId = crypto.randomUUID();
    this._stops.update(stops => stops.map(s =>
      s.stopId === stopId
        ? { ...s, selectedAttractions: [...s.selectedAttractions, { entryId, attractionId, startTime, endTime: null, date }] }
        : s
    ));
  }

  patchAttractionTime(stopId: string, entryId: string, field: 'startTime' | 'endTime', value: string | null): void {
    this._stops.update(stops => stops.map(s =>
      s.stopId === stopId
        ? { ...s, selectedAttractions: s.selectedAttractions.map(a =>
            a.entryId === entryId ? { ...a, [field]: value } : a
          )}
        : s
    ));
  }

  removeAttraction(stopId: string, entryId: string): void {
    this._stops.update(stops => stops.map(s =>
      s.stopId === stopId
        ? { ...s, selectedAttractions: s.selectedAttractions.filter(a => a.entryId !== entryId) }
        : s
    ));
  }

  updateStartTime(stopId: string, entryId: string, startTime: string, date?: string): void {
    this._stops.update(stops => stops.map(s =>
      s.stopId === stopId
        ? { ...s, selectedAttractions: s.selectedAttractions.map(a =>
            a.entryId === entryId
              ? { ...a, startTime, date: date ?? a.date }
              : a
          )}
        : s
    ));
  }

  isAttractionSelected(stopId: string, attractionId: string): boolean {
    return this._stops().find(s => s.stopId === stopId)
      ?.selectedAttractions.some(a => a.attractionId === attractionId) ?? false;
  }

  getAllPlannedEntries(stopId: string, attractionId: string): PlannedAttraction[] {
    return this._stops().find(s => s.stopId === stopId)
      ?.selectedAttractions.filter(a => a.attractionId === attractionId) ?? [];
  }

  getPlannedAttraction(stopId: string, attractionId: string): PlannedAttraction | null {
    return this.getAllPlannedEntries(stopId, attractionId)[0] ?? null;
  }

  selectedAttractionsFor(stopId: string): PlannedAttraction[] {
    return this._stops().find(s => s.stopId === stopId)?.selectedAttractions ?? [];
  }
}
