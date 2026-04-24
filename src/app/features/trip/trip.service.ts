import { Injectable, signal, computed } from '@angular/core';
import { City } from '../../core/models/city.model';
import { TripStop } from '../../core/models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private _stops = signal<TripStop[]>([]);
  private _activeId = signal<string | null>(null);

  readonly stops = this._stops.asReadonly();
  readonly activeId = this._activeId.asReadonly();
  readonly existingCityIds = computed(() => this._stops().map(s => s.cityId));
  readonly activeStop = computed(() => this._stops().find(s => s.cityId === this._activeId()) ?? null);

  addStop(city: City, checkIn: string, checkOut: string): void {
    this._stops.update(prev => [...prev, { cityId: city.id, checkIn, checkOut }]);
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
}
