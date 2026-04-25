import { Injectable, signal, computed } from '@angular/core';
import { City } from '../../core/models/city.model';
import { TripStop, Planification } from '../../core/models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private _stops = signal<TripStop[]>([]);
  private _activeId = signal<string | null>(null);

  readonly stops = this._stops.asReadonly();
  readonly activeId = this._activeId.asReadonly();
  readonly existingCityIds = computed(() => this._stops().map(s => s.cityId));
  readonly activeStop = computed(() => this._stops().find(s => s.cityId === this._activeId()) ?? null);

  readonly planification = computed((): Planification | null => {
    const stops = this._stops();
    if (stops.length === 0) return null;
    return {
      stops,
      totalAttractions: stops.reduce((sum, s) => sum + s.selectedAttractions.length, 0),
    };
  });

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

  addAttraction(cityId: string, attractionId: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId
        ? { ...s, selectedAttractions: [...new Set([...s.selectedAttractions, attractionId])] }
        : s
    ));
  }

  removeAttraction(cityId: string, attractionId: string): void {
    this._stops.update(stops => stops.map(s =>
      s.cityId === cityId
        ? { ...s, selectedAttractions: s.selectedAttractions.filter(id => id !== attractionId) }
        : s
    ));
  }

  isAttractionSelected(cityId: string, attractionId: string): boolean {
    return this._stops().find(s => s.cityId === cityId)
      ?.selectedAttractions.includes(attractionId) ?? false;
  }

  selectedAttractionsFor(cityId: string): string[] {
    return this._stops().find(s => s.cityId === cityId)?.selectedAttractions ?? [];
  }
}
