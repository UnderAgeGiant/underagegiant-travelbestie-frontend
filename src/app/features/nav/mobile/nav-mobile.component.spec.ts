import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavMobileComponent } from './nav-mobile.component';
import { NavFacadeService } from '../nav-facade.service';
import { SavedPlansService } from '../../../core/saved-plans/saved-plans.service';
import { SharedTrip } from '../../../core/shared-trips/shared-trips.service';

describe('NavMobileComponent — loading a saved plan from the drawer', () => {
  let fixture: ComponentFixture<NavMobileComponent>;
  let facade: NavFacadeService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavMobileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const savedPlans = TestBed.inject(SavedPlansService);
    savedPlans.register({ id: 'p1', name: 'Euro trip', savedAt: '2026-07-01T00:00:00Z', stops: [] });
    facade = TestBed.inject(NavFacadeService);

    fixture = TestBed.createComponent(NavMobileComponent);
    fixture.componentInstance.drawerOpen.set(true);
    facade.plansOpen.set(true);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('closes the drawer and loads the plan when a saved plan is clicked', () => {
    const loadBtn = fixture.nativeElement.querySelector('.up-plan-load') as HTMLButtonElement;
    expect(loadBtn).toBeTruthy();

    loadBtn.click();
    fixture.detectChanges();

    expect(facade.trip.loadedPlanId()).toBe('p1');
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.nav-m-drawer')).toBeNull();
  });
});

describe('NavMobileComponent — signing out from the drawer', () => {
  let fixture: ComponentFixture<NavMobileComponent>;
  let facade: NavFacadeService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavMobileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);

    fixture = TestBed.createComponent(NavMobileComponent);
    fixture.componentInstance.drawerOpen.set(true);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // Regression test — facade.doLogout() clears app-wide state (auth, trip, karma, etc.) but
  // has no way to reach into NavMobileComponent's own local drawerOpen signal. The "Cerrar
  // sesión" button used to call facade.doLogout() directly, so the drawer stayed open — still
  // showing the now-stale account/plans/favorites sections — right behind the "Iniciar sesión"
  // button that replaces the burger menu once logged out.
  it('closes the drawer when signing out', () => {
    const logoutSpy = jest.spyOn(facade, 'doLogout').mockImplementation(() => {});
    const signOutBtn = fixture.nativeElement.querySelector('.signout-btn') as HTMLButtonElement;
    expect(signOutBtn).toBeTruthy();

    signOutBtn.click();
    fixture.detectChanges();

    expect(logoutSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.nav-m-drawer')).toBeNull();
  });
});

describe('NavMobileComponent — opening Comprar Karma from the drawer', () => {
  let fixture: ComponentFixture<NavMobileComponent>;
  let facade: NavFacadeService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavMobileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);

    fixture = TestBed.createComponent(NavMobileComponent);
    fixture.componentInstance.drawerOpen.set(true);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // Regression test — the "Comprar Karma" button in the drawer used to call facade.openBuyKarma()
  // directly without closing drawerOpen. With z-index raised to 950/951, the drawer backdrop/panel
  // would obscure the karma-purchase modal underneath (z-index 400), making it inaccessible. This
  // test verifies the button now closes the drawer as it opens the modal.
  it('closes the drawer and opens buy karma modal when Comprar Karma is clicked', () => {
    const openBuyKarmaSpy = jest.spyOn(facade, 'openBuyKarma').mockImplementation(() => {});
    const karmaBtn = Array.from(fixture.nativeElement.querySelectorAll('.up-plans-btn'))
      .find((btn: any) => btn.textContent.includes('Comprar Karma')) as HTMLButtonElement;
    expect(karmaBtn).toBeTruthy();

    karmaBtn.click();
    fixture.detectChanges();

    expect(openBuyKarmaSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.nav-m-drawer')).toBeNull();
  });
});

describe('NavMobileComponent — selecting a shared trip from the drawer', () => {
  let fixture: ComponentFixture<NavMobileComponent>;
  let facade: NavFacadeService;

  const SHARED: SharedTrip = {
    id: 'share-1', ownerEmail: 'a@b.com', ownerName: 'Ana', tripName: 'Roma 2026',
    createdAt: '2026-07-01T00:00:00Z', stops: [], transits: [],
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavMobileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(NavFacadeService);
    facade.navSharedTrips.set([SHARED]);

    fixture = TestBed.createComponent(NavMobileComponent);
    fixture.componentInstance.drawerOpen.set(true);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // Regression test — the shared-trip search-result row used to call facade.openSharedTrip(id)
  // directly, never closing drawerOpen, so navigating to the trip left the drawer covering it.
  it('closes the drawer and navigates when a shared-trip search result is clicked', () => {
    const openSharedTripSpy = jest.spyOn(facade, 'openSharedTrip').mockImplementation(() => {});
    const row = fixture.nativeElement.querySelector('.up-shared-trip-row') as HTMLButtonElement;
    expect(row).toBeTruthy();

    row.click();
    fixture.detectChanges();

    expect(openSharedTripSpy).toHaveBeenCalledWith('share-1');
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.nav-m-drawer')).toBeNull();
  });

  // Same bug, the favorites/"mis viajes publicados" panel's rows share the same handler
  // (goToSharedTrip) — verified directly on the component since driving through the
  // accordion-expand UI to reach the same code path adds no extra coverage.
  it('onGoToShared closes the drawer and delegates to facade.goToSharedTrip', () => {
    const goToSharedTripSpy = jest.spyOn(facade, 'goToSharedTrip').mockImplementation(() => {});

    fixture.componentInstance.onGoToShared('share-2');

    expect(goToSharedTripSpy).toHaveBeenCalledWith('share-2');
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
  });
});
