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
