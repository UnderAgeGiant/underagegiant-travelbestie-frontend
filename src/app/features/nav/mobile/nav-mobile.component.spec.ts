import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavMobileComponent } from './nav-mobile.component';
import { NavFacadeService } from '../nav-facade.service';
import { SavedPlansService } from '../../../core/saved-plans/saved-plans.service';

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
