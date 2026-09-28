import { Injectable, inject, signal, untracked } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Comment } from '../models/comment.model';

/**
 * Session cache of attraction comments per city, shared by DestinationComponent (desktop
 * panel) and MobileAttractionsModalComponent (mobile sheet) so switching stops back and
 * forth costs one GET /comments?ids= per city, not one per switch per component.
 */
@Injectable({ providedIn: 'root' })
export class CityCommentsService {
  private readonly api = inject(ApiService);
  private readonly _byCity = signal<Record<string, Record<string, Comment[]>>>({});
  private readonly inFlight = new Set<string>();
  // Tracks which cities have had a successful load() — separate from _byCity's keys,
  // since addLocal() also populates _byCity[cityId] for a city that was never (or
  // never successfully) loaded, which must not make load() think it's cached forever.
  private readonly loadedCities = new Set<string>();

  commentsFor(cityId: string): Record<string, Comment[]> {
    return this._byCity()[cityId] ?? {};
  }

  load(cityId: string, attractionIds: string[]): void {
    untracked(() => {
      if (attractionIds.length === 0 || this.loadedCities.has(cityId) || this.inFlight.has(cityId)) return;
      this.inFlight.add(cityId);
      this.api.getCommentsBatch(attractionIds)
        .pipe(finalize(() => this.inFlight.delete(cityId)))
        .subscribe({
          next: map => {
            this.loadedCities.add(cityId);
            this._byCity.update(all => {
              const localForCity = all[cityId] ?? {};
              const merged: Record<string, Comment[]> = { ...map };
              for (const attractionId of Object.keys(localForCity)) {
                if (!(attractionId in map)) merged[attractionId] = localForCity[attractionId];
              }
              return { ...all, [cityId]: merged };
            });
          },
          error: () => { /* non-fatal — not cached, so the next load() retries */ },
        });
    });
  }

  addLocal(cityId: string, attractionId: string, comment: Comment): void {
    this._byCity.update(all => {
      const city = all[cityId] ?? {};
      return { ...all, [cityId]: { ...city, [attractionId]: [...(city[attractionId] ?? []), comment] } };
    });
  }
}
