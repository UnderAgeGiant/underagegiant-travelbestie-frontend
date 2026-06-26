import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NavFacadeService } from './nav-facade.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';

describe('NavFacadeService — favorites list', () => {
  let facade: NavFacadeService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(NavFacadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('opens the panel and fetches favorites on first toggle', () => {
    facade.toggleFavorites();
    expect(facade.favoritesOpen()).toBe(true);
    expect(facade.favorites.loading()).toBe(true);

    const req = http.expectOne(r => r.url.includes('/favorites'));
    req.flush([
      { shareId: 'abc', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);

    expect(facade.favorites.loading()).toBe(false);
    expect(facade.favorites.favoritedTrips().length).toBe(1);
  });

  it('does not refetch favorites on subsequent opens (cache)', () => {
    facade.toggleFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([]);
    facade.toggleFavorites();  // closes
    facade.toggleFavorites();  // reopens
    http.expectNone(r => r.url.includes('/favorites'));
  });

  it('filters favorites by trip name via the search box', () => {
    facade.toggleFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'a', tripName: 'Paris Adventure', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
      { shareId: 'b', tripName: 'Tokyo Trip', ownerName: 'Lee', stops: [], transits: [], favoritedAt: '2026-01-02' },
    ]);
    expect(facade.filteredFavorites().length).toBe(2);
    facade.favoritesSearch.set('paris');
    expect(facade.filteredFavorites().length).toBe(1);
    expect(facade.filteredFavorites()[0].shareId).toBe('a');
  });

  it('closes the favorites panel when the user menu closes', () => {
    facade.favoritesOpen.set(true);
    facade.userMenuOpen.set(true);
    facade.toggleUserMenu();
    expect(facade.favoritesOpen()).toBe(false);
  });
});

describe('NavFacadeService — shared trips + logo', () => {
  let facade: NavFacadeService;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(NavFacadeService);
    savedPlans = TestBed.inject(SavedPlansService);
  });

  it('lists only saved plans that have a shareId', () => {
    savedPlans.register({ id: '1', name: 'Paris Trip', savedAt: '2026-01-01', stops: [], shareId: 'share-1' });
    savedPlans.register({ id: '2', name: 'Tokyo Trip', savedAt: '2026-01-02', stops: [] });
    expect(facade.mySharedTrips().length).toBe(1);
    expect(facade.mySharedTrips()[0].id).toBe('share-1');
  });

  it('filters shared trips by name via the search box', () => {
    savedPlans.register({ id: '1', name: 'Paris Trip', savedAt: '2026-01-01', stops: [], shareId: 'share-1' });
    savedPlans.register({ id: '2', name: 'Tokyo Trip', savedAt: '2026-01-02', stops: [], shareId: 'share-2' });
    expect(facade.filteredSharedTrips().length).toBe(2);
    facade.sharedTripsSearch.set('tokyo');
    expect(facade.filteredSharedTrips().length).toBe(1);
  });

  it('onLogoClick clears stops and closes menus without throwing', () => {
    const trip = TestBed.inject(TripService);
    facade.userMenuOpen.set(true);
    facade.plansOpen.set(true);
    facade.onLogoClick();
    expect(facade.userMenuOpen()).toBe(false);
    expect(facade.plansOpen()).toBe(false);
    expect(trip.stops().length).toBe(0);
  });
});
