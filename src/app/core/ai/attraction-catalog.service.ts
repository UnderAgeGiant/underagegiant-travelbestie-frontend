import { Injectable } from '@angular/core';
import { CityCatalog } from '../models/ai.model';

@Injectable({ providedIn: 'root' })
export class AttractionCatalogService {
  private cache: Promise<CityCatalog> | null = null;

  /** Build the { cityId: [{id,name}] } catalog used for AI planning.
   *  The heavy attraction dataset is pulled in via dynamic import(), so it is
   *  code-split into a lazy chunk instead of the initial bundle. Memoized. */
  getCityCatalog(): Promise<CityCatalog> {
    if (!this.cache) {
      this.cache = (async () => {
        const [{ WORLD_CITIES }, { getAttractions }] = await Promise.all([
          import('../../data/cities.data'),
          import('../../data/attractions.data'),
        ]);
        return Object.fromEntries(
          WORLD_CITIES.map(city => [
            city.id,
            getAttractions(city).map(a => ({ id: a.id, name: a.name })),
          ]),
        ) as CityCatalog;
      })();
    }
    return this.cache;
  }
}
