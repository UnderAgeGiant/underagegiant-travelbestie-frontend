import { TestBed } from '@angular/core/testing';
import { AttractionCatalogService } from './attraction-catalog.service';

describe('AttractionCatalogService', () => {
  it('getCityCatalog builds attractions only for the requested city IDs', async () => {
    TestBed.configureTestingModule({ providers: [AttractionCatalogService] });
    const svc = TestBed.inject(AttractionCatalogService);
    const catalog = await svc.getCityCatalog(['paris', 'rome']);
    expect(Object.keys(catalog).sort()).toEqual(['paris', 'rome']);
    expect(Array.isArray(catalog['paris'])).toBe(true);
    expect(catalog['paris'].length).toBeGreaterThan(0);
  });

  it('getCityCatalog memoizes each city\'s attraction array across calls', async () => {
    TestBed.configureTestingModule({ providers: [AttractionCatalogService] });
    const svc = TestBed.inject(AttractionCatalogService);
    const a = await svc.getCityCatalog(['paris']);
    const b = await svc.getCityCatalog(['paris']);
    expect(a['paris']).toBe(b['paris']);
  });

  it('getCityIndex returns a lightweight id/name entry for every WORLD_CITIES city, memoized', async () => {
    TestBed.configureTestingModule({ providers: [AttractionCatalogService] });
    const svc = TestBed.inject(AttractionCatalogService);
    const a = await svc.getCityIndex();
    const b = await svc.getCityIndex();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
  });
});
