import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { FavoritedTrip } from '../models/trip.model';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(ApiService);

  private readonly _favoritedIds = signal<Set<string>>(new Set());

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

  toggle(
    shareId: string,
    onSuccess: (result: { favorited: boolean; favoriteCount: number }) => void,
    onError: () => void,
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

  getFavorites(): ReturnType<ApiService['getFavorites']> {
    return this.api.getFavorites();
  }
}
