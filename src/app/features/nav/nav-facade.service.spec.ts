import { ApplicationRef, Component, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NavFacadeService, shouldSearchSharedTrips } from './nav-facade.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';
import { AuthService } from '../../core/auth/auth.service';
import { LandingFeedService } from '../landing/feed/landing-feed.service';
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

  it('onLogoClick clears stops, closes menus, and navigates to the landing', () => {
    const trip = TestBed.inject(TripService);
    const nav = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    facade.userMenuOpen.set(true);
    facade.plansOpen.set(true);
    facade.onLogoClick();
    expect(facade.userMenuOpen()).toBe(false);
    expect(facade.plansOpen()).toBe(false);
    expect(trip.stops().length).toBe(0);
    expect(nav).toHaveBeenCalledWith('/');
  });

  it('doLoadPlan opens the editor at /plan', () => {
    const nav = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    facade.doLoadPlan({ id: 'trip-1', name: 'My Trip', savedAt: '2026-01-01', stops: [] });
    expect(nav).toHaveBeenCalledWith('/plan');
  });

  it('doNewTrip navigates to the landing', () => {
    const nav = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    facade.doNewTrip();
    expect(nav).toHaveBeenCalledWith('/');
  });

  it('openProfile closes the user menu and navigates to /profile', () => {
    const nav = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    facade.userMenuOpen.set(true);
    facade.openProfile();
    expect(facade.userMenuOpen()).toBe(false);
    expect(nav).toHaveBeenCalledWith('/profile');
  });

  it('doLogout clears the trip and returns to the landing at / (from /plan, /profile, /my-trips, /ai-planning)', () => {
    // doLogout() already ends with router.navigate(['/']) — this pins it so the routing work can't drop it.
    const trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '02/06/2026');
    const nav = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    facade.doLogout();
    expect(trip.stops().length).toBe(0);
    expect(nav).toHaveBeenCalledWith(['/']);
  });

  it('autoSaveCurrentTrip() (invoked by onLogoClick) passes { background: true } to upsert() (Finding 4 fix)', () => {
    const trip = TestBed.inject(TripService);
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
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

describe('NavFacadeService — openMyTrips()', () => {
  it('closes the user menu, sets pendingMyTripsTab, and navigates to /my-trips', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const facade = TestBed.inject(NavFacadeService);
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigateByUrl');
    facade.userMenuOpen.set(true);

    facade.openMyTrips();

    expect(facade.userMenuOpen()).toBe(false);
    expect(facade.pendingMyTripsTab()).toBe('trips');
    expect(navSpy).toHaveBeenCalledWith('/my-trips');
  });

  it('accepts an explicit tab', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const facade = TestBed.inject(NavFacadeService);

    facade.openMyTrips('aiplans');

    expect(facade.pendingMyTripsTab()).toBe('aiplans');
  });
});

describe('NavFacadeService — logout clears the landing feed', () => {
  let facade: NavFacadeService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);
  });

  it('resets LandingFeedService so a stale feed never lingers across sessions (feedback F2)', () => {
    const landingFeed = TestBed.inject(LandingFeedService);
    const spy = jest.spyOn(landingFeed, 'reset');
    facade.doLogout();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('NavFacadeService — leaves private pages when the session ends', () => {
  @Component({ template: '' }) class Blank {}

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        provideRouter([
          { path: '', component: Blank },
          { path: 'profile', component: Blank },
          { path: 'my-trips', component: Blank },
          { path: 'karma-history', component: Blank },
          { path: 'about', component: Blank },
        ]),
      ],
    });
  });

  it.each(['/profile', '/my-trips', '/karma-history'])('session lost on %s → navigates to /', async path => {
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    TestBed.inject(NavFacadeService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(path);
    auth.clearTokens();            // what a failed silent refresh does
    TestBed.tick();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(router.url).toBe('/');
  });

  it('does not move a signed-out user off a public page', async () => {
    const auth = TestBed.inject(AuthService);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    TestBed.inject(NavFacadeService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/about');
    auth.clearTokens();
    TestBed.tick();
    expect(router.url).toBe('/about');
  });
});

describe('shouldSearchSharedTrips (C7)', () => {
  it('skips empty, blank and single-character queries', () => {
    expect(shouldSearchSharedTrips('')).toBe(false);
    expect(shouldSearchSharedTrips('   ')).toBe(false);
    expect(shouldSearchSharedTrips('a')).toBe(false);
    expect(shouldSearchSharedTrips(' a ')).toBe(false);
  });

  it('searches from two characters', () => {
    expect(shouldSearchSharedTrips('pa')).toBe(true);
    expect(shouldSearchSharedTrips(' París ')).toBe(true);
  });
});

describe('NavFacadeService — openEditor() / openAiPlanning()', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  }));

  it('openEditor navigates to /plan', () => {
    const facade = TestBed.inject(NavFacadeService);
    const spy = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    facade.userMenuOpen.set(true);
    facade.openEditor();
    expect(facade.userMenuOpen()).toBe(false);
    expect(spy).toHaveBeenCalledWith('/plan');
  });

  it('openAiPlanning navigates to /ai-planning with no state for a fresh open', () => {
    const facade = TestBed.inject(NavFacadeService);
    const spy = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    facade.openAiPlanning();
    expect(spy).toHaveBeenCalledWith(['/ai-planning'], {});
  });

  it('openAiPlanning passes a past plan as history state', () => {
    const facade = TestBed.inject(NavFacadeService);
    const spy = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const payload = { result: {} as any, requestId: 'r1' };
    facade.openAiPlanning(payload);
    expect(spy).toHaveBeenCalledWith(['/ai-planning'], { state: { aiPlanResult: payload } });
  });
});
