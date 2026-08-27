import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { AiPlanningComponent } from './ai-planning.component';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { Trip } from '../../core/models/trip.model';
import { TripSuggestion, PlanTripResponse } from '../../core/models/ai.model';

// AiPlanningComponent renders <app-nav>, whose DeviceService reads window.matchMedia.
(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

const OPTION: TripSuggestion = { id: 1, title: 'Opción A', summary: 'Resumen', highlights: ['h1'] };

const TRIP: Trip = {
  title: 'Viaje de prueba',
  stops: [{
    stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026',
    selectedAttractions: [],
  }],
  transits: [],
};

describe('AiPlanningComponent — auto-opened plan presentation', () => {
  let component: AiPlanningComponent;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    // Create the component (and its injected SavedPlansService) BEFORE logging in —
    // SavedPlansService's constructor fires a real GET /trips if a user is already
    // logged in at construction time, which would otherwise leave an unexpected
    // request outstanding for http.verify() to trip over.
    component = TestBed.createComponent(AiPlanningComponent).componentInstance;
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
  });

  afterEach(() => http.verify());

  it('auto-opens the presentation once the plan finishes generating', fakeAsync(() => {
    component.selectedOption.set(OPTION);
    expect(component.planSlideshowOpen()).toBe(false);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-1' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-1/status')).flush({ status: 'completed', result: TRIP });

    expect(component.step()).toBe('result');
    expect(component.planSlideshowOpen()).toBe(true);
  }));

  it('closing the presentation returns to the static result view without discarding the plan', fakeAsync(() => {
    component.selectedOption.set(OPTION);
    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-2' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-2/status')).flush({ status: 'completed', result: TRIP });

    component.planSlideshowOpen.set(false);

    expect(component.planSlideshowOpen()).toBe(false);
    expect(component.step()).toBe('result');
    expect(component.generatedTrip()).toEqual(TRIP);
  }));
});

describe('AiPlanningComponent — save() marks the plan as loaded', () => {
  let component: AiPlanningComponent;
  let auth: AuthService;
  let trip: TripService;
  let http: HttpTestingController;

  const TRIP: Trip = {
    title: 'Viaje de prueba',
    stops: [
      { stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] },
      { stopId: 's2', cityId: 'london', checkIn: '06/06/2026', checkOut: '10/06/2026', selectedAttractions: [] },
    ],
    transits: [],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    trip = TestBed.inject(TripService);
    http = TestBed.inject(HttpTestingController);
    // Create the component (and its injected SavedPlansService) BEFORE logging in —
    // SavedPlansService's constructor fires a real GET /trips if a user is already
    // logged in at construction time, which would otherwise leave an unexpected
    // request outstanding for http.verify() to trip over.
    component = TestBed.createComponent(AiPlanningComponent).componentInstance;
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    component.generatedTrip.set(TRIP);
  });

  afterEach(() => http.verify());

  it('selects the first city and records the server-assigned trip id after saving', () => {
    let saved = false;
    component.planSaved.subscribe(() => { saved = true; });

    component.save();

    const req = http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST');
    req.flush({ id: 'trip-42', ...TRIP });

    expect(trip.activeStop()?.stopId).toBe('s1');
    expect(trip.loadedPlanId()).toBe('trip-42');
    expect(saved).toBe(true);
  });
});

describe('AiPlanningComponent — 15s taking-long dog', () => {
  let component: AiPlanningComponent;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    // Create the component (and its injected SavedPlansService) BEFORE logging in —
    // SavedPlansService's constructor fires a real GET /trips if a user is already
    // logged in at construction time, which would otherwise leave an unexpected
    // request outstanding for http.verify() to trip over.
    component = TestBed.createComponent(AiPlanningComponent).componentInstance;
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
  });

  it('shows planTakingLong after 15s while the plan request is still pending', fakeAsync(() => {
    const planTrip$ = new Subject<PlanTripResponse>();
    (component as any).api.planTrip = jest.fn().mockReturnValue(planTrip$.asObservable());
    component.selectedOption.set({ id: 1, title: 't', summary: 's', highlights: [] });

    component.executePlan();
    expect(component.planTakingLong()).toBe(false);

    tick(15000);
    expect(component.planTakingLong()).toBe(true);

    planTrip$.next({ title: 'Plan', stops: [], transits: [] });
    planTrip$.complete();
    tick(0);
    expect(component.planTakingLong()).toBe(false);   // cleared once it resolves
  }));

  it('notifyMeInstead unsubscribes, hides the dog, stops loading, and shows the hand-off confirmation', fakeAsync(() => {
    const planTrip$ = new Subject<PlanTripResponse>();
    (component as any).api.planTrip = jest.fn().mockReturnValue(planTrip$.asObservable());
    component.selectedOption.set({ id: 1, title: 't', summary: 's', highlights: [] });

    component.executePlan();
    tick(15000);
    expect(component.planTakingLong()).toBe(true);

    component.notifyMeInstead();

    expect(component.planTakingLong()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.notifyConfirmVisible()).toBe(true);

    // Late resolution after the user opted out must not resurrect loading state
    planTrip$.next({ title: 'Plan', stops: [], transits: [] });
    tick(0);
    expect(component.loading()).toBe(false);
  }));

  it('confirmNotify hides the hand-off card and emits viewFeaturedTrips', fakeAsync(() => {
    const planTrip$ = new Subject<PlanTripResponse>();
    (component as any).api.planTrip = jest.fn().mockReturnValue(planTrip$.asObservable());
    component.selectedOption.set({ id: 1, title: 't', summary: 's', highlights: [] });
    component.executePlan();
    tick(15000);
    component.notifyMeInstead();

    let emitted = false;
    component.viewFeaturedTrips.subscribe(() => { emitted = true; });

    component.confirmNotify();

    expect(component.notifyConfirmVisible()).toBe(false);
    expect(emitted).toBe(true);
  }));
});

describe('AiPlanningComponent — initialResult (revisiting a past "Mis Planes IA" plan)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
  });

  it('jumps straight to Step 3 with the slideshow open when initialResult is set', () => {
    const fixture = TestBed.createComponent(AiPlanningComponent);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    fixture.componentRef.setInput('initialResult', TRIP);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.step()).toBe('result');
    expect(component.generatedTrip()).toEqual(TRIP);
    expect(component.planSlideshowOpen()).toBe(true);
  });

  it('stays on Step 1 when no initialResult is provided', () => {
    const fixture = TestBed.createComponent(AiPlanningComponent);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('preferences');
  });
});
