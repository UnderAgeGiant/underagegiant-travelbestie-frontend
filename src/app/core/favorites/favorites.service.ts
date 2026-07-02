import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { FavoritedTrip } from '../models/trip.model';

type FavoritedTripMeta = Pick<FavoritedTrip, 'tripName' | 'ownerName' | 'stops' | 'transits' | 'favoriteCount'>;

const CACHE_TTL = 86_400_000; // 24 h in ms

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api  = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _favoritedIds   = signal<Set<string>>(new Set());
  private readonly _favoritedTrips = signal<FavoritedTrip[]>([]);
  private readonly _loading        = signal(false);
  private loaded = false;
  private _lastEmail: string | null = null;

  readonly favoritedTrips = this._favoritedTrips.asReadonly();
  readonly loading        = this._loading.asReadonly();

  constructor() {
    if (this.auth.currentUser()) this.loadFavorites();
  }

  private get cacheKey(): string | null {
    const email = this._lastEmail ?? this.auth.currentUser()?.email ?? null;
    return email ? `tb:favorites:cache:${email}` : null;
  }

  private readCache(): FavoritedTrip[] | null {
    const key = this.cacheKey;
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw) as { data: FavoritedTrip[]; ts: number };
      return Date.now() - ts < CACHE_TTL ? data : null;
    } catch { return null; }
  }

  private writeCache(trips: FavoritedTrip[]): void {
    const key = this.cacheKey;
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify({ data: trips, ts: Date.now() })); } catch { /* non-fatal */ }
  }

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

  loadFavorites(force = false): void {
    if (this.loaded && !force) return;
    const email = this.auth.currentUser()?.email;
    if (email) this._lastEmail = email;

    if (!force) {
      const cached = this.readCache();
      if (cached) {
        this._favoritedTrips.set(cached);
        this._favoritedIds.set(new Set(cached.map(t => t.shareId)));
        this.loaded = true;
        return;
      }
    }

    this._loading.set(true);
    this.api.getFavorites().subscribe({
      next: trips => {
        this._favoritedTrips.set(trips);
        this._favoritedIds.set(new Set(trips.map(t => t.shareId)));
        this.loaded = true;
        this._loading.set(false);
        this.writeCache(trips);
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
        this.writeCache(this._favoritedTrips());
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

  clear(): void {
    const key = this.cacheKey;
    this._favoritedIds.set(new Set());
    this._favoritedTrips.set([]);
    this.loaded = false;
    this._lastEmail = null;
    if (key) { try { localStorage.removeItem(key); } catch { /* non-fatal */ } }
  }
}
