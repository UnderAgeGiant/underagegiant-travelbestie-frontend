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
    expect(component.currentAiPlanRequestId()).toBe('req-1');
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

  it('deletes the backing ai_plan_requests row after a successful save when currentAiPlanRequestId is set', () => {
    component.currentAiPlanRequestId.set('req-99');

    component.save();

    const tripReq = http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST');
    tripReq.flush({ id: 'trip-42', ...TRIP });

    const delReq = http.expectOne(r => r.url.includes('/ai/plan/req-99') && r.method === 'DELETE');
    delReq.flush(null);

    expect(component.currentAiPlanRequestId()).toBeNull();
  });

  it('does not call DELETE when currentAiPlanRequestId is null', () => {
    expect(component.currentAiPlanRequestId()).toBeNull();

    component.save();

    const tripReq = http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST');
    tripReq.flush({ id: 'trip-42', ...TRIP });

    http.verify();   // fails if any unexpected (e.g. DELETE) request was made
  });

  it('sets saving to true while the request is in flight, guarding against a double-click', () => {
    expect(component.saving()).toBe(false);

    component.save();
    expect(component.saving()).toBe(true);

    // A second click while saving must not fire a second POST /trips.
    component.save();

    const tripReq = http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST');
    tripReq.flush({ id: 'trip-42', ...TRIP });
  });

  it('resets saving to false when the save request errors, so the button re-enables', () => {
    component.save();
    expect(component.saving()).toBe(true);

    const tripReq = http.expectOne(r => r.url.endsWith('/trips') && r.method === 'POST');
    tripReq.flush({ error: 'Insufficient karma: need 1, have 0' }, { status: 402, statusText: 'Payment Required' });

    expect(component.saving()).toBe(false);
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

describe('AiPlanningComponent — initialResult (revisiting a past "Planes IA Pendientes" plan)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
  });

  it('jumps straight to Step 3 with the slideshow open and records requestId when initialResult is set', () => {
    const fixture = TestBed.createComponent(AiPlanningComponent);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    fixture.componentRef.setInput('initialResult', { result: TRIP, requestId: 'req-77' });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.step()).toBe('result');
    expect(component.generatedTrip()).toEqual(TRIP);
    expect(component.planSlideshowOpen()).toBe(true);
    expect(component.currentAiPlanRequestId()).toBe('req-77');
  });

  it('stays on Step 1 when no initialResult is provided', () => {
    const fixture = TestBed.createComponent(AiPlanningComponent);
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('preferences');
  });
});

describe('AiPlanningComponent — never deletes ai_plan_requests rows except via save()', () => {
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
    component = TestBed.createComponent(AiPlanningComponent).componentInstance;
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
  });

  afterEach(() => http.verify());

  it('does not delete the previously-tracked row when executePlan() completes again — just starts tracking the new one', fakeAsync(() => {
    component.currentAiPlanRequestId.set('req-old');
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-new' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-new/status')).flush({ status: 'completed', result: TRIP });

    expect(component.currentAiPlanRequestId()).toBe('req-new');
    http.verify();   // fails if a DELETE (or any other unexpected request) was made — the "req-old" row must survive
  }));

  it('does not call DELETE on the first successful generation when nothing was previously tracked', fakeAsync(() => {
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-1' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-1/status')).flush({ status: 'completed', result: TRIP });

    http.verify();   // fails if a DELETE (or any other unexpected request) was made
  }));

  it('does not delete the tracked row when reset() is called — it just stops tracking it', () => {
    component.currentAiPlanRequestId.set('req-abandoned');

    component.reset();

    expect(component.currentAiPlanRequestId()).toBeNull();
    http.verify();   // fails if a DELETE (or any other unexpected request) was made — the row must survive in Planes IA Pendientes
  });

  it('does not call DELETE from reset() when currentAiPlanRequestId is null', () => {
    expect(component.currentAiPlanRequestId()).toBeNull();

    component.reset();

    http.verify();   // fails if any unexpected (e.g. DELETE) request was made
  });
});

describe('AiPlanningComponent — restart() (↩ Volver a empezar) keeps the Step 1 form filled', () => {
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
    component = TestBed.createComponent(AiPlanningComponent).componentInstance;
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
  });

  afterEach(() => http.verify());

  it('returns to Step 1 without clearing the form fields', fakeAsync(() => {
    component.preferences.set('playa y museos');
    component.duration.set(7);
    component.budget.set('500-1000 USD');
    component.startDate.set('01/06/2026');
    component.selectedCategories.set(['poi']);
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-1' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-1/status')).flush({ status: 'completed', result: TRIP });
    expect(component.step()).toBe('result');

    component.restart();

    expect(component.step()).toBe('preferences');
    expect(component.preferences()).toBe('playa y museos');
    expect(component.duration()).toBe(7);
    expect(component.budget()).toBe('500-1000 USD');
    expect(component.startDate()).toBe('01/06/2026');
    expect(component.selectedCategories()).toEqual(['poi']);
  }));

  it('clears the generated plan and session/change tracking, but keeps tracking the abandoned row unless saved', fakeAsync(() => {
    component.preferences.set('playa y museos');
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan') && r.method === 'POST').flush({ requestId: 'req-2' });
    tick(0);
    http.expectOne(r => r.url.includes('/ai/plan/req-2/status')).flush({ status: 'completed', result: TRIP });

    component.restart();

    expect(component.generatedTrip()).toBeNull();
    expect(component.currentAiPlanRequestId()).toBeNull();
    expect(component.suggestions()).toBeNull();
    expect(component.selectedOption()).toBeNull();
    http.verify();   // no DELETE fired — the abandoned row survives in Planes IA Pendientes
  }));

  it('reset() (unlike restart()) blanks the form fields back to empty', () => {
    component.preferences.set('playa y museos');
    component.duration.set(7);
    component.budget.set('500-1000 USD');
    component.startDate.set('01/06/2026');
    component.selectedCategories.set(['poi']);

    component.reset();

    expect(component.preferences()).toBe('');
    expect(component.duration()).toBeUndefined();
    expect(component.budget()).toBe('');
    expect(component.startDate()).toBe('');
    expect(component.selectedCategories()).toEqual([]);
  });
});
