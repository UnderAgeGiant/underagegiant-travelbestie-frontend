import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AiPlanningComponent } from './ai-planning.component';
import { AuthService } from '../../core/auth/auth.service';
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
