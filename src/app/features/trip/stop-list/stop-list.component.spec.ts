import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
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

    component.suggestForCity(stop);

    expect(authModal.isOpen()).toBe(true);
    expect(citySuggest.openForStopId()).toBeNull();
  });

  it('requests suggestions immediately when already logged in', async () => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    const stop = trip.stops()[0];

    component.suggestForCity(stop);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(citySuggest.openForStopId()).toBe(stop.stopId);
    http.expectOne(r => r.url.includes('/ai/suggest-attractions')).flush({ suggestions: [] });
  });

  it('re-requests suggestions after logging in through the modal callback (no stale event reused)', async () => {
    const stop = trip.stops()[0];

    component.suggestForCity(stop);
    expect(citySuggest.openForStopId()).toBeNull();

    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    authModal.executePostLogin();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(citySuggest.openForStopId()).toBe(stop.stopId);
    http.expectOne(r => r.url.includes('/ai/suggest-attractions')).flush({ suggestions: [] });
  });
});

describe('StopListComponent — city info badge (visa/currency/plug)', () => {
  let fixture: ComponentFixture<StopListComponent>;
  let trip: TripService;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // desktop viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(StopListComponent);
  });

  function openPopover(): void {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
  }

  it('shows a visa row in the popover when logged in with a countryOfResidence set (CL -> FR is visa-free for 90 days)', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: 'CL' });
    openPopover();

    const popover = fixture.nativeElement.querySelector('.city-info-popover');
    expect(popover.textContent).toContain('90');
  }));

  it('shows a CTA row instead of a visa result when logged in with no countryOfResidence set', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    openPopover();

    expect(fixture.nativeElement.querySelector('.city-info-row.city-info-cta')).toBeTruthy();
  }));

  it('emits openProfile when the CTA row is clicked', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    openPopover();

    let emitted = false;
    fixture.componentInstance.openProfile.subscribe(() => { emitted = true; });
    (fixture.nativeElement.querySelector('.city-info-row.city-info-cta') as HTMLElement).click();
    expect(emitted).toBe(true);
  }));

  it('shows currency and plug rows to an anonymous visitor (Paris -> EUR, no adapter flag without a home country)', fakeAsync(() => {
    openPopover();

    const popover = fixture.nativeElement.querySelector('.city-info-popover');
    expect(popover.textContent).toContain('€');
    expect(popover.textContent).toContain('Tipo');
    expect(popover.textContent).not.toContain('adaptador');
  }));

  it('flags adapter needed when the logged-in user\'s country uses no shared plug type with the destination', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: 'US' });
    openPopover();

    expect(fixture.nativeElement.querySelector('.city-info-popover').textContent).toContain('adaptador');
  }));
});

describe('StopListComponent — attraction time inputs (24-hour, via TimePickerComponent)', () => {
  let component: StopListComponent;
  let fixture: ComponentFixture<StopListComponent>;
  let trip: TripService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(StopListComponent);
    component = fixture.componentInstance;
  });

  it('renders an app-time-picker (not a native <input type="time">) for a planned attraction', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    const stopId = trip.activeStop()!.stopId;
    fixture.detectChanges();

    component['toggleScheduled'](stopId);
    fixture.detectChanges();

    const pickers = fixture.nativeElement.querySelectorAll('app-time-picker.att-time-input');
    expect(pickers.length).toBe(2); // start + end
    expect(fixture.nativeElement.querySelector('input[type="time"]')).toBeNull();
  });

  // Regression coverage for the switch from a native <input type="time"> (whose 12h/24h
  // display follows the browser/OS locale, unforceable to 24h on every browser) to
  // app-time-picker (flatpickr, time_24hr) — onAttractionTimeChange used to read
  // (event.target as HTMLInputElement).value from a native `change` event; TimePickerComponent's
  // timeChange output emits the already-formatted "HH:mm" string directly.
  it('patches the attraction time from a plain "HH:mm" string, not a DOM event', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'patchAttractionTime');

    component.onAttractionTimeChange(stopId, entryId, 'startTime', '14:30', 120);

    expect(trip.patchAttractionTime).toHaveBeenCalledWith(stopId, entryId, 'startTime', '14:30', 120);
  });

  it('patches a null value when given an empty string (time cleared)', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'patchAttractionTime');

    component.onAttractionTimeChange(stopId, entryId, 'endTime', '');

    expect(trip.patchAttractionTime).toHaveBeenCalledWith(stopId, entryId, 'endTime', null, undefined);
  });
});

describe('StopListComponent — itinerary/AI-suggest pill row layout', () => {
  let fixture: ComponentFixture<StopListComponent>;
  let trip: TripService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();
  });

  it('puts the itinerary and AI-suggest pills in the same grid row, each with its own accent color', () => {
    const row = fixture.nativeElement.querySelector('.stop-pill-row');
    const itineraryBtn = row.querySelector('.stop-itinerary-pill:not(.stop-ai-suggest-pill)');
    const aiBtn = row.querySelector('.stop-ai-suggest-pill');
    expect(itineraryBtn).toBeTruthy();
    expect(aiBtn).toBeTruthy();
    expect(aiBtn.classList.contains('stop-itinerary-pill')).toBe(true); // still shares the base pill class
  });
});

