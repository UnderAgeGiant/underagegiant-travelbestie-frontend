import { TestBed } from '@angular/core/testing';
import { AttractionCatalogService } from './attraction-catalog.service';

describe('AttractionCatalogService', () => {
  it('lazily builds a non-empty city catalog on first call', async () => {
    TestBed.configureTestingModule({ providers: [AttractionCatalogService] });
    const svc = TestBed.inject(AttractionCatalogService);
    const catalog = await svc.getCityCatalog();
    expect(Object.keys(catalog).length).toBeGreaterThan(0);
    const firstCity = Object.values(catalog)[0];
    expect(Array.isArray(firstCity)).toBe(true);
  });

  it('memoizes — the second call returns the same reference', async () => {
    TestBed.configureTestingModule({ providers: [AttractionCatalogService] });
    const svc = TestBed.inject(AttractionCatalogService);
    const a = await svc.getCityCatalog();
    const b = await svc.getCityCatalog();
    expect(a).toBe(b);
  });
});
