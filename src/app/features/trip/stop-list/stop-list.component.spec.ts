import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StopListComponent } from './stop-list.component';
import { TripService } from '../trip.service';
import { DestinationModalService } from '../../destination/destination-modal.service';
import { City } from '../../../core/models/city.model';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { CitySuggestService } from '../../../core/ai/city-suggest.service';
import { HttpTestingController } from '@angular/common/http/testing';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

// jsdom has no matchMedia — DeviceService (injected by StopListComponent) needs one.
// Mirrors the helper already used in day-timeline.component.spec.ts.
function installMatchMediaMock(initialMatches: boolean): void {
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (window as any).matchMedia = () => mql;
}

describe('StopListComponent — mobile add-attraction trigger', () => {
  let component: StopListComponent;
  let trip: TripService;
  let destModal: DestinationModalService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(true); // mobile viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    destModal = TestBed.inject(DestinationModalService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('activates the stop and opens the destination modal', () => {
    const stopId = trip.stops()[0].stopId;

    component.openAddAttraction(stopId);

    expect(trip.activeId()).toBe(stopId);
    expect(destModal.isOpen()).toBe(true);
  });
});

describe('StopListComponent — AI city suggestions', () => {
  let component: StopListComponent;
  let trip: TripService;
  let auth: AuthService;
  let authModal: AuthModalService;
  let citySuggest: CitySuggestService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // desktop viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip        = TestBed.inject(TripService);
    auth        = TestBed.inject(AuthService);
    authModal   = TestBed.inject(AuthModalService);
    citySuggest = TestBed.inject(CitySuggestService);
    http        = TestBed.inject(HttpTestingController);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('opens the login modal instead of requesting suggestions when logged out', () => {
    const stop = trip.stops()[0];
    const clickEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;

    component.suggestForCity(stop, clickEvent);

    expect(authModal.isOpen()).toBe(true);
    expect(citySuggest.openForStopId()).toBeNull();
  });

  it('requests suggestions immediately when already logged in', async () => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    const stop = trip.stops()[0];
    const clickEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;

    component.suggestForCity(stop, clickEvent);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(citySuggest.openForStopId()).toBe(stop.stopId);
    http.expectOne(r => r.url.includes('/ai/suggest-attractions')).flush({ suggestions: [] });
  });
});
