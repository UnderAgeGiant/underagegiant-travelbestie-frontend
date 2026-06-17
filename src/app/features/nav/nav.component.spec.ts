import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NavComponent } from './nav.component';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';

describe('NavComponent — favorites list', () => {
  let component: NavComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    component = TestBed.createComponent(NavComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('opens the panel and fetches favorites on first toggle', () => {
    component.toggleFavorites();
    expect(component.favoritesOpen()).toBe(true);
    expect(component.favorites.loading()).toBe(true);

    const req = http.expectOne(r => r.url.includes('/favorites'));
    req.flush([
      { shareId: 'abc', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);

    expect(component.favorites.loading()).toBe(false);
    expect(component.favorites.favoritedTrips().length).toBe(1);
    expect(component.favorites.favoritedTrips()[0].tripName).toBe('Paris Trip');
  });

  it('does not refetch favorites on subsequent opens (cache)', () => {
    component.toggleFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([]);

    component.toggleFavorites();  // closes
    component.toggleFavorites();  // reopens

    http.expectNone(r => r.url.includes('/favorites'));
  });

  it('closes the favorites panel when the user menu closes', () => {
    component.favoritesOpen.set(true);
    component.userMenuOpen.set(true);
    component.toggleUserMenu();
    expect(component.favoritesOpen()).toBe(false);
  });

  it('filters favorites by trip name via the search box', () => {
    component.toggleFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([
      { shareId: 'a', tripName: 'Paris Adventure', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
      { shareId: 'b', tripName: 'Tokyo Trip', ownerName: 'Lee', stops: [], transits: [], favoritedAt: '2026-01-02' },
    ]);

    expect(component.filteredFavorites().length).toBe(2);

    component.favoritesSearch.set('paris');
    expect(component.filteredFavorites().length).toBe(1);
    expect(component.filteredFavorites()[0].shareId).toBe('a');
  });

  it('clears the favorites search when the panel closes', () => {
    component.toggleFavorites();
    http.expectOne(r => r.url.includes('/favorites')).flush([]);
    component.favoritesSearch.set('paris');

    component.toggleFavorites();  // closes
    expect(component.favoritesSearch()).toBe('');
  });
});

describe('NavComponent — shared trips list', () => {
  let component: NavComponent;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    component = TestBed.createComponent(NavComponent).componentInstance;
    savedPlans = TestBed.inject(SavedPlansService);
  });

  it('lists only saved plans that have a shareId', () => {
    savedPlans.register({ id: '1', name: 'Paris Trip', savedAt: '2026-01-01', stops: [], shareId: 'share-1' });
    savedPlans.register({ id: '2', name: 'Tokyo Trip', savedAt: '2026-01-02', stops: [] });

    expect(component.mySharedTrips().length).toBe(1);
    expect(component.mySharedTrips()[0].id).toBe('share-1');
  });

  it('filters shared trips by name via the search box', () => {
    savedPlans.register({ id: '1', name: 'Paris Trip', savedAt: '2026-01-01', stops: [], shareId: 'share-1' });
    savedPlans.register({ id: '2', name: 'Tokyo Trip', savedAt: '2026-01-02', stops: [], shareId: 'share-2' });

    expect(component.filteredSharedTrips().length).toBe(2);
    component.sharedTripsSearch.set('tokyo');
    expect(component.filteredSharedTrips().length).toBe(1);
    expect(component.filteredSharedTrips()[0].id).toBe('share-2');
  });

  it('clears the shared-trips search when the panel closes', () => {
    component.myTripsOpen.set(true);
    component.sharedTripsSearch.set('tokyo');
    component.toggleMyTrips();
    expect(component.sharedTripsSearch()).toBe('');
  });
});
