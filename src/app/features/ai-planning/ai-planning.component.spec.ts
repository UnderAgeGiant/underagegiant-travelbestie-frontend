import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AiPlanningComponent } from './ai-planning.component';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { Trip } from '../../core/models/trip.model';
import { TripSuggestion } from '../../core/models/ai.model';

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

  it('auto-opens the presentation once the plan finishes generating', () => {
    component.selectedOption.set(OPTION);
    expect(component.planSlideshowOpen()).toBe(false);

    component.executePlan();

    http.expectOne(r => r.url.includes('/ai/plan')).flush(TRIP);

    expect(component.step()).toBe('result');
    expect(component.planSlideshowOpen()).toBe(true);
  });

  it('closing the presentation returns to the static result view without discarding the plan', () => {
    component.selectedOption.set(OPTION);
    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan')).flush(TRIP);

    component.planSlideshowOpen.set(false);

    expect(component.planSlideshowOpen()).toBe(false);
    expect(component.step()).toBe('result');
    expect(component.generatedTrip()).toEqual(TRIP);
  });
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

  it('returns to Step 1 without clearing the form fields', () => {
    component.preferences.set('playa y museos');
    component.duration.set(7);
    component.budget.set('500-1000 USD');
    component.startDate.set('01/06/2026');
    component.selectedCategories.set(['poi']);
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan')).flush(TRIP);
    expect(component.step()).toBe('result');

    component.restart();

    expect(component.step()).toBe('preferences');
    expect(component.preferences()).toBe('playa y museos');
    expect(component.duration()).toBe(7);
    expect(component.budget()).toBe('500-1000 USD');
    expect(component.startDate()).toBe('01/06/2026');
    expect(component.selectedCategories()).toEqual(['poi']);
  });

  it('clears the generated plan and selection/suggestion state', () => {
    component.preferences.set('playa y museos');
    component.selectedOption.set(OPTION);

    component.executePlan();
    http.expectOne(r => r.url.includes('/ai/plan')).flush(TRIP);

    component.restart();

    expect(component.generatedTrip()).toBeNull();
    expect(component.suggestions()).toBeNull();
    expect(component.selectedOption()).toBeNull();
  });

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
