import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavFacadeService } from './nav-facade.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';
import { AuthService } from '../../core/auth/auth.service';
import { City } from '../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

describe('NavFacadeService — favorites list', () => {
  let facade: NavFacadeService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);
    savedPlans = TestBed.inject(SavedPlansService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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

  it('autoSaveCurrentTrip() (invoked by onLogoClick) passes { background: true } to upsert() (Finding 4 fix)', () => {
    const trip = TestBed.inject(TripService);
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    trip.addStop(PARIS, '01/06/2026', '02/06/2026');
    trip.markAsLoadedPlan('trip-1');
    savedPlans.register({ id: 'trip-1', name: 'My Trip', savedAt: '2026-01-01', stops: [] });

    const spy = jest.spyOn(savedPlans, 'upsert');
    facade.onLogoClick();

    expect(spy).toHaveBeenCalledWith(
      'ana@test.com', 'trip-1', 'My Trip', expect.any(Array), expect.any(Array), { background: true },
    );
    http.expectOne(r => r.url.includes('/trips/trip-1')).flush({ id: 'trip-1', title: 'My Trip', stops: [], transits: [] });
  });
});
