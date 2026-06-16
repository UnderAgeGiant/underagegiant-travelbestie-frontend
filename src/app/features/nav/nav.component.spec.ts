import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NavComponent } from './nav.component';

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
    expect(component.favLoading()).toBe(true);

    const req = http.expectOne(r => r.url.includes('/favorites'));
    req.flush([
      { shareId: 'abc', tripName: 'Paris Trip', ownerName: 'Ana', stops: [], transits: [], favoritedAt: '2026-01-01' },
    ]);

    expect(component.favLoading()).toBe(false);
    expect(component.favoritedTrips().length).toBe(1);
    expect(component.favoritedTrips()[0].tripName).toBe('Paris Trip');
  });

  it('does not refetch favorites on subsequent opens', () => {
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
});
