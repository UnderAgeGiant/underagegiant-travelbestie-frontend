import { Injectable } from '@angular/core';
import { CatalogEntry, CityCatalog } from '../models/ai.model';

@Injectable({ providedIn: 'root' })
export class AttractionCatalogService {
  private cityIndexCache: Promise<CatalogEntry[]> | null = null;
  private readonly attractionCache = new Map<string, CatalogEntry[]>();

  /** Lightweight { id, name } entry per WORLD_CITIES city — no attractions.
   *  Sent to /ai/suggest so ARIA can return valid cityIds per option. Memoized. */
  getCityIndex(): Promise<CatalogEntry[]> {
    if (!this.cityIndexCache) {
      this.cityIndexCache = import('../../data/cities.data').then(
        ({ WORLD_CITIES }) => WORLD_CITIES.map(city => ({ id: city.id, name: city.name })),
      );
    }
    return this.cityIndexCache;
  }

  /** Builds a { cityId: [{id,name}] } attractions catalog for exactly the given
   *  city IDs — used by /ai/plan so the payload only covers the trip's own
   *  cities instead of every WORLD_CITIES city. Per-city lists are memoized. */
  async getCityCatalog(cityIds: string[]): Promise<CityCatalog> {
    const [{ WORLD_CITIES }, { getAttractions }] = await Promise.all([
      import('../../data/cities.data'),
      import('../../data/attractions.data'),
    ]);

    const catalog: CityCatalog = {};
    for (const city of WORLD_CITIES.filter(c => cityIds.includes(c.id))) {
      if (!this.attractionCache.has(city.id)) {
        this.attractionCache.set(city.id, getAttractions(city).map(a => ({ id: a.id, name: a.name })));
      }
      catalog[city.id] = this.attractionCache.get(city.id)!;
    }
    return catalog;
  }
}
