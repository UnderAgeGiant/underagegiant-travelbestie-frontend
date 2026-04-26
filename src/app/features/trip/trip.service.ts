import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { City } from '../../core/models/city.model';
import { TripStop, PlannedAttraction, Planification } from '../../core/models/trip.model';
import { AuthService } from '../../core/auth/auth.service';

const planKey       = (email: string) => `tb_plan_${email}`;
const activePlanKey = (email: string) => `tb_active_plan_${email}`;

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly auth = inject(AuthService);

  private _stops        = signal<TripStop[]>([]);
  private _activeId     = signal<string | null>(null);
  private _loadedPlanId = signal<string | null>(null);
  private _saving       = false;

  readonly stops        = this._stops.asReadonly();
  readonly activeId     = this._activeId.asReadonly();
  readonly loadedPlanId = this._loadedPlanId.asReadonly();
  readonly existingCityIds = computed(() => this._stops().map(s => s.cityId));
  readonly activeStop      = computed(() => this._stops().find(s => s.cityId === this._activeId()) ?? null);

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

    // Auto-save on every stops/loadedPlanId mutation (skip during bulk restore)
    effect(() => {
      const user     = this.auth.currentUser();
      const stops    = this._stops();
      const loadedId = this._loadedPlanId();
      if (user?.email && !this._saving) {
        localStorage.setItem(planKey(user.email), JSON.stringify(stops));
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
        const stops = JSON.parse(raw) as TripStop[];
        this._stops.set(stops);
        this._activeId.set(stops[0]?.cityId ?? null);
      } catch {
        this._stops.set([]);
        this._activeId.set(null);
      }
    } else {
      this._stops.set([]);
      this._activeId.set(null);
    }
    this._loadedPlanId.set(activeId ?? null);
    this._saving = false;
  }

  /** Wipe in-memory plan without touching localStorage (called on logout). */
  clearPlan(): void {
    this._saving = true;
    this._stops.set([]);
    this._activeId.set(null);
    this._loadedPlanId.set(null);
    this._saving = false;
  }

  /** Load a named saved plan as the active working plan. */
  restoreStops(stops: TripStop[], planId: string | null = null): void {
    this._saving = true;
    this._stops.set(stops);
    this._activeId.set(stops[0]?.cityId ?? null);
    this._loadedPlanId.set(planId);
    this._saving = false;
  }

  /** Update which saved-plan id is currently active (called after upsert). */
  markAsLoadedPlan(id: string | null): void {
    this._loadedPlanId.set(id);
  }

  addStop(city: City, checkIn: string, checkOut: string): void {
    this._stops.update(prev => [...prev, { cityId: city.id, checkIn, checkOut, selectedAttractions: [] }]);
    this._activeId.set(city.id);
  }

  removeStop(cityId: string): void {
    const remaining = this._stops().filter(s => s.cityId !== cityId);
    this._stops.set(remaining);
    if (this._activeId() === cityId) {
      this._activeId.set(remaining[0]?.cityId ?? null);
    }
  }

  setActive(cityId: string): void {
    this._activeId.set(cityId);
  }

  addAttraction(cityId: string, attractionId: string, startTime: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId && !s.selectedAttractions.some(a => a.attractionId === attractionId)
        ? { ...s, selectedAttractions: [...s.selectedAttractions, { attractionId, startTime }] }
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

  updateStartTime(cityId: string, attractionId: string, startTime: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId
        ? { ...s, selectedAttractions: s.selectedAttractions.map(a =>
            a.attractionId === attractionId ? { ...a, startTime } : a
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
