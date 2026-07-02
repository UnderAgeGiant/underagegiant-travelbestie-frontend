import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FavoritesService } from './favorites.service';
import { AuthService } from '../auth/auth.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
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

describe('FavoritesService – localStorage cache', () => {
  const EMAIL    = 'cache@test.com';
  const CACHE_KEY = `tb:favorites:cache:${EMAIL}`;
  const TRIPS = [
    { shareId: 'abc', tripName: 'Paris', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
  ];

  let http: HttpTestingController;

  function boot() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal({ email: EMAIL, name: 'Tester' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(FavoritesService);
  }

  afterEach(() => { try { http.verify(); } catch { /* ignore */ } localStorage.removeItem(CACHE_KEY); });

  it('writes trips to localStorage after API fetch', () => {
    const svc = boot(); // constructor calls loadFavorites() → no cache → HTTP
    http.expectOne(r => r.url.includes('/favorites')).flush(TRIPS);
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY)!);
    expect(stored.data).toEqual(TRIPS);
    expect(typeof stored.ts).toBe('number');
  });

  it('reads from localStorage when cache is fresh — no HTTP call', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: TRIPS, ts: Date.now() }));
    const svc = boot(); // constructor reads cache → no HTTP
    http.expectNone(r => r.url.includes('/favorites'));
    expect(svc.favoritedTrips()).toEqual(TRIPS);
  });

  it('ignores stale cache (> 24 h) and fetches from API', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: [], ts: Date.now() - 86_400_001 }));
    const svc = boot(); // stale → HTTP
    http.expectOne(r => r.url.includes('/favorites')).flush(TRIPS);
    expect(svc.favoritedTrips()).toEqual(TRIPS);
  });

  it('toggle() updates localStorage cache after server confirms', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: TRIPS, ts: Date.now() }));
    const svc = boot(); // reads cache
    http.expectNone(r => r.url.includes('/favorites'));

    svc.toggle('abc', () => {}, () => {});
    http.expectOne(r => r.url.includes('/favorite')).flush({ favorited: false, favoriteCount: 0 });

    const stored = JSON.parse(localStorage.getItem(CACHE_KEY)!);
    expect(stored.data.some((t: { shareId: string }) => t.shareId === 'abc')).toBe(false);
  });

  it('clear() removes the user-keyed localStorage entry', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: TRIPS, ts: Date.now() }));
    const svc = boot(); // reads cache
    http.expectNone(r => r.url.includes('/favorites'));
    svc.clear();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });
});
