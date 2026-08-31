import { TestBed, ComponentFixture } from '@angular/core/testing';
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
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
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

    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', homeCity: null });
    authModal.executePostLogin();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(citySuggest.openForStopId()).toBe(stop.stopId);
    http.expectOne(r => r.url.includes('/ai/suggest-attractions')).flush({ suggestions: [] });
  });
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

describe('StopListComponent — first-day weather chip on the city card', () => {
  let trip: TripService;
  let http: HttpTestingController;
  let fixture: ComponentFixture<StopListComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StopListComponent);
  });

  it('requests weather for a stop as soon as it is added', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    const req = http.expectOne(r => r.url.includes('/weather') && r.params.get('cityId') === 'paris');
    expect(req.request.params.get('checkIn')).toBe('01/06/2026');
    expect(req.request.params.get('checkOut')).toBe('05/06/2026');
    req.flush({ days: [] }, { headers: { ETag: '"etag-1"' } });
  });

  it('renders a min/max temperature chip next to the city name once weather resolves', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-weather-chip')).toBeNull();

    const req = http.expectOne(r => r.url.includes('/weather'));
    req.flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('14°');
    expect(chip.textContent).toContain('23°');
    expect(chip.classList.contains('stop-weather-chip-historic')).toBe(false);
  });

  it('renders the chip in grayscale-historic mode with a "?" mark when the day is a historic estimate', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    const req = http.expectOne(r => r.url.includes('/weather'));
    req.flush(
      { days: [{ date: '01/06/2026', type: 'historic', tempMinC: 9, tempMaxC: 18, weatherCode: 61 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    expect(chip.classList.contains('stop-weather-chip-historic')).toBe(true);
    expect(chip.querySelector('.stop-weather-mark')).not.toBeNull();
  });

  it('does not render a chip when the day is unavailable', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    const req = http.expectOne(r => r.url.includes('/weather'));
    req.flush(
      { days: [{ date: '01/06/2026', type: 'unavailable' }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-weather-chip')).toBeNull();
  });

  afterEach(() => jest.useRealTimers());

  it('opens a popover on hover listing every day in the stop\'s range with icon, min/max, and a forecast/historic tag', () => {
    jest.useFakeTimers();
    trip.addStop(PARIS, '01/06/2026', '03/06/2026');
    fixture.detectChanges();

    http.expectOne(r => r.url.includes('/weather')).flush(
      {
        days: [
          { date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 },
          { date: '02/06/2026', type: 'forecast', tempMinC: 15, tempMaxC: 24, weatherCode: 0 },
          { date: '03/06/2026', type: 'historic', tempMinC: 9,  tempMaxC: 18, weatherCode: 61 },
        ],
      },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).toBeNull();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.stop-weather-popover-row');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('14°/23°');
    expect(rows[0].classList.contains('stop-weather-popover-row-historic')).toBe(false);
    expect(rows[2].textContent).toContain('9°/18°');
    expect(rows[2].classList.contains('stop-weather-popover-row-historic')).toBe(true);
  });

  it('does not open the popover before the 150ms hover delay elapses', () => {
    jest.useFakeTimers();
    trip.addStop(PARIS, '01/06/2026', '01/06/2026');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).toBeNull();
  });

  it('closes the popover on mouseleave', () => {
    jest.useFakeTimers();
    trip.addStop(PARIS, '01/06/2026', '01/06/2026');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).not.toBeNull();

    chip.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).toBeNull();
  });

  it('toggles the popover on click for touch devices with no hover capability', () => {
    trip.addStop(PARIS, '01/06/2026', '01/06/2026');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    installMatchMediaMock(true); // simulate '(hover: none)' matching (touch device)
    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).not.toBeNull();

    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).toBeNull();
  });

  it('does not open the popover on click when the device can hover (desktop)', () => {
    trip.addStop(PARIS, '01/06/2026', '01/06/2026');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.stop-weather-chip');
    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.stop-weather-popover')).toBeNull();
  });
});
