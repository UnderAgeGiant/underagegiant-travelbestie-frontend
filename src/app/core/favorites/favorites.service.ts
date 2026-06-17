import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { FavoritedTrip } from '../models/trip.model';

type FavoritedTripMeta = Pick<FavoritedTrip, 'tripName' | 'ownerName' | 'stops' | 'transits' | 'favoriteCount'>;

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(ApiService);

  private readonly _favoritedIds   = signal<Set<string>>(new Set());
  private readonly _favoritedTrips = signal<FavoritedTrip[]>([]);
  private readonly _loading        = signal(false);
  private loaded = false;

  readonly favoritedTrips = this._favoritedTrips.asReadonly();
  readonly loading        = this._loading.asReadonly();

  isFavorited(shareId: string): boolean {
    return this._favoritedIds().has(shareId);
  }

  seedFromPayload(shareId: string, isFavoritedByMe: boolean): void {
    this._favoritedIds.update(set => {
      const next = new Set(set);
      if (isFavoritedByMe) next.add(shareId);
      else next.delete(shareId);
      return next;
    });
  }

  /** Loads the favorited-trips list once and caches it; pass force=true to refetch. */
  loadFavorites(force = false): void {
    if (this.loaded && !force) return;
    this._loading.set(true);
    this.api.getFavorites().subscribe({
      next: trips => {
        this._favoritedTrips.set(trips);
        this._favoritedIds.set(new Set(trips.map(t => t.shareId)));
        this.loaded = true;
        this._loading.set(false);
      },
      error: () => { this._loading.set(false); },
    });
  }

  toggle(
    shareId: string,
    onSuccess: (result: { favorited: boolean; favoriteCount: number }) => void,
    onError: () => void,
    tripMeta?: FavoritedTripMeta,
  ): void {
    const wasOn = this.isFavorited(shareId);
    this._favoritedIds.update(set => {
      const next = new Set(set);
      wasOn ? next.delete(shareId) : next.add(shareId);
      return next;
    });

    this.api.toggleFavorite(shareId).subscribe({
      next: result => {
        this._favoritedIds.update(set => {
          const next = new Set(set);
          result.favorited ? next.add(shareId) : next.delete(shareId);
          return next;
        });
        this._favoritedTrips.update(list => {
          if (!result.favorited) return list.filter(t => t.shareId !== shareId);
          if (list.some(t => t.shareId === shareId) || !tripMeta) return list;
          return [{ shareId, favoritedAt: new Date().toISOString(), ...tripMeta }, ...list];
        });
        onSuccess(result);
      },
      error: () => {
        this._favoritedIds.update(set => {
          const next = new Set(set);
          wasOn ? next.add(shareId) : next.delete(shareId);
          return next;
        });
        onError();
      },
    });
  }

  /** Clears the cache, e.g. on logout. */
  clear(): void {
    this._favoritedIds.set(new Set());
    this._favoritedTrips.set([]);
    this.loaded = false;
  }
}
