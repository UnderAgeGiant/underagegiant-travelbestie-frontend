import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FavoritesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads favorites once and serves subsequent calls from cache', () => {
    service.loadFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'a', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);
    expect(service.favoritedTrips().length).toBe(1);

    service.loadFavorites();
    http.expectNone(r => r.url.includes('/favorites'));
  });

  it('refetches when force=true', () => {
    service.loadFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([]);

    service.loadFavorites(true);
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'b', tripName: 'Tokyo Trip', ownerName: 'Lee', stops: [], transits: [], favoritedAt: '2026-01-02' },
    ]);
    expect(service.favoritedTrips().length).toBe(1);
  });

  it('removes a trip from the cache when toggled off', () => {
    service.loadFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'a', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);

    service.toggle('a', () => {}, () => {});
    http.expectOne(r => r.url.includes('/favorite')).flush({ favorited: false, favoriteCount: 0 });

    expect(service.favoritedTrips().length).toBe(0);
  });

  it('adds a trip to the cache when toggled on with trip metadata supplied', () => {
    service.toggle('c', () => {}, () => {}, { tripName: 'Rome Trip', ownerName: 'Mo', stops: [], transits: [] });
    http.expectOne(r => r.url.includes('/favorite')).flush({ favorited: true, favoriteCount: 1 });

    expect(service.favoritedTrips().length).toBe(1);
    expect(service.favoritedTrips()[0].tripName).toBe('Rome Trip');
  });

  it('clears the cache so the next load refetches', () => {
    service.loadFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'a', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);

    service.clear();
    expect(service.favoritedTrips().length).toBe(0);

    service.loadFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([]);
  });
});
