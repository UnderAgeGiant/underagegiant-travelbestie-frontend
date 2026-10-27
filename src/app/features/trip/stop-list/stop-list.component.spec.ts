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
import { PersonalActivityModalService } from '../../destination/personal-activity/personal-activity-modal.service';
import { SavedPlansService, SavedPlan } from '../../../core/saved-plans/saved-plans.service';
import { Place } from '../../../core/models/trip.model';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { AutoSaveService } from '../../../core/saved-plans/auto-save.service';

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

  it('reserves footer space under the "Ir arriba" FAB so it never covers the footer buttons', () => {
    const fixture = TestBed.createComponent(StopListComponent);
    const el = fixture.nativeElement as HTMLElement;
    (fixture.componentInstance as any).showScrollTop.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.scroll-top-fab')).toBeTruthy();
    expect(el.querySelector('.panel-footer')?.classList).toContain('panel-footer--fab');

    fixture.componentInstance.bookOpen.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.scroll-top-fab')).toBeNull();
    expect(el.querySelector('.panel-footer')?.classList).not.toContain('panel-footer--fab');
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

  // CityInfoBadgeComponent reparents its popover to document.body (so it always
  // escapes the .stop-item card's hover/active transform, which would otherwise
  // trap a position:fixed popover behind other stop cards) — query it there, not
  // under fixture.nativeElement, which only ever contains the trigger now.
  function popover(): HTMLElement | null {
    return document.body.querySelector('.city-info-popover');
  }

  it('shows a visa row in the popover when logged in with a countryOfResidence set (CL -> FR is visa-free for 90 days)', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: 'CL' });
    openPopover();

    expect(popover()!.textContent).toContain('90');
  }));

  it('shows a CTA row instead of a visa result when logged in with no countryOfResidence set', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    openPopover();

    expect(popover()!.querySelector('.city-info-row.city-info-cta')).toBeTruthy();
  }));

  it('emits openPreferences when the CTA row is clicked', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null });
    openPopover();

    let emitted = false;
    fixture.componentInstance.openPreferences.subscribe(() => { emitted = true; });
    (popover()!.querySelector('.city-info-row.city-info-cta') as HTMLElement).click();
    expect(emitted).toBe(true);
  }));

  it('shows currency and plug rows to an anonymous visitor (Paris -> EUR, no adapter flag without a home country)', fakeAsync(() => {
    openPopover();

    const pop = popover()!;
    expect(pop.textContent).toContain('€');
    expect(pop.textContent).toContain('Tipo');
    expect(pop.textContent).not.toContain('adaptador');
  }));

  it('flags adapter needed when the logged-in user\'s country uses no shared plug type with the destination', fakeAsync(() => {
    auth.setTokens('fake-token', { name: 'Ana', email: 'ana@test.com', countryOfResidence: 'US' });
    openPopover();

    expect(popover()!.textContent).toContain('adaptador');
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

describe('StopListComponent — trip map button (feedback #10)', () => {
  let component: StopListComponent;
  let trip: TripService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
  });

  it('shows the "Ver mapa del viaje" button next to panel-head-sub when the trip has stops, and opens the map on click', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();

    const sub = fixture.nativeElement.querySelector('.panel-head-sub');
    const btn: HTMLButtonElement = sub.querySelector('.tl-trip-map-btn');
    expect(btn).not.toBeNull();

    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-trip-map')).not.toBeNull();
  });

  it('does not show the "Ver mapa del viaje" button when the trip has no stops', () => {
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tl-trip-map-btn')).toBeNull();
  });
});

describe('StopListComponent — Guardar viaje bounce beacon (feedback #12)', () => {
  let trip: TripService;
  let fixture: ComponentFixture<StopListComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
  });

  it('bounces the "Guardar viaje" button once the first destination is added and the trip is unsaved', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.panel-footer .btn-pill.btn-primary');
    expect(btn.classList.contains('ai-save-cta')).toBe(true);
    expect(btn.classList.contains('save-cta-strong')).toBe(true);
  });

  it('stops bouncing once the trip has been saved (loadedPlanId is set)', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    trip.markAsLoadedPlan('plan-1');
    fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.panel-footer .btn-pill.btn-primary');
    expect(btn.classList.contains('ai-save-cta')).toBe(false);
    expect(btn.classList.contains('save-cta-strong')).toBe(false);
  });
});

describe('StopListComponent — planned duration follows start/end time (feedback T1 2026-09-28)', () => {
  it('shows end − start instead of the catalog duration, and updates when the end time changes', () => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      selectedAttractions: [{ entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: '13:00', date: '01/06/2026' }],
    }] as any, null, [] as any);
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();
    (fixture.componentInstance as any).toggleScheduled('s1');
    fixture.detectChanges();

    const meta = () => (fixture.nativeElement.querySelector('.att-plan-row .att-plan-name')!.nextElementSibling as HTMLElement).textContent!;
    expect(meta()).toContain('3h');

    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      selectedAttractions: [{ entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: '10:45', date: '01/06/2026' }],
    }] as any, null, [] as any);
    fixture.detectChanges();
    expect(meta()).toContain('45');
  });
});

describe('StopListComponent — stopSelected output (Feature 68)', () => {
  it('emits stopSelected when a stop is clicked', () => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();

    const emitted = jest.fn();
    fixture.componentInstance.stopSelected.subscribe(emitted);
    fixture.nativeElement.querySelector('.stop-item').click();
    expect(emitted).toHaveBeenCalled();
  });
});


describe('StopListComponent — personal activities (Feature 71)', () => {
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
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      selectedAttractions: [
        { entryId: 'p1', activityType: 'lunch', title: 'Almuerzo con Rosa', isPrivate: true, startTime: '13:00', endTime: '14:00', date: '01/06/2026' },
        { entryId: 'e1', attractionId: 'paris_0', startTime: '13:30', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [] as any);
    fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();
    (fixture.componentInstance as any).toggleScheduled('s1');
    fixture.detectChanges();
  });

  const personalRow = (): HTMLElement =>
    [...fixture.nativeElement.querySelectorAll('.att-plan-row')].find((r: Element) => r.textContent!.includes('Almuerzo con Rosa')) as HTMLElement;

  it('renders the personal row with its private badge', () => {
    expect(personalRow()).toBeTruthy();
    expect(personalRow().querySelector('.att-plan-private')).not.toBeNull();
  });

  it('clicking the personal row name opens the edit modal', () => {
    const spy = jest.spyOn(TestBed.inject(PersonalActivityModalService), 'openEdit');
    (personalRow().querySelector('.att-plan-name') as HTMLElement).click();
    expect(spy).toHaveBeenCalledWith('s1', 'p1');
  });

  it('flags a catalog attraction overlapping the lunch', () => {
    expect(fixture.componentInstance.hasTimeCollision(trip.stops()[0], 'e1')).toBe(true);
  });
});

describe('StopListComponent — Escape key handler', () => {
  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(true); // mobile viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
  });

  it('Escape closes the trip map modal', () => {
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.detectChanges();
    (fixture.componentInstance as any).tripMapOpen.set(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect((fixture.componentInstance as any).tripMapOpen()).toBe(false);
  });
});

describe('StopListComponent — cost settings on new-plan save', () => {
  let component: StopListComponent;
  let trip: TripService;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // desktop viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('saves with costSettings.origin equal to the user homePlace', () => {
    const home: Place = { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' };
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true);
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: home } as any);
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('new-id'));

    component.doBook();
    component.bookName.set('Mi viaje');
    component.doBookSave();

    expect(upsert).toHaveBeenCalledWith(
      'ana@test.com', null, 'Mi viaje', trip.stops(), trip.transits(),
      expect.objectContaining({ costSettings: expect.objectContaining({ origin: home, adults: 1, children: 0, comfort: 'mid' }) }),
    );
  });
});

describe('StopListComponent — cost card calculate', () => {
  let component: StopListComponent;
  let trip: TripService;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // desktop viewport
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    savedPlans.register({ id: 'plan-1', name: 'Mi viaje', savedAt: '2026-10-22T00:00:00.000Z', stops: trip.stops(), transits: [] });
    trip.markAsLoadedPlan('plan-1');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('with no origin and a profile homePlace, saves with that origin and does not call estimate directly', () => {
    const home: Place = { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' };
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: home } as any);
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    const estimate = jest.spyOn(savedPlans, 'estimate');

    component.calculate();

    expect(upsert).toHaveBeenCalledWith(
      'ana@test.com', 'plan-1', 'Mi viaje', trip.stops(), trip.transits(),
      expect.objectContaining({ costSettings: expect.objectContaining({ origin: home }) }),
    );
    expect(estimate).not.toHaveBeenCalled();
  });
});

describe('StopListComponent — cost card calculate with the settings block open', () => {
  let component: StopListComponent;
  let trip: TripService;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    savedPlans.register({ id: 'plan-1', name: 'Mi viaje', savedAt: '2026-10-22T00:00:00.000Z', stops: trip.stops(), transits: [] });
    trip.markAsLoadedPlan('plan-1');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('saves the pending settings instead of estimating the stored snapshot', () => {
    const home: Place = { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' };
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: home } as any);
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    const estimate = jest.spyOn(savedPlans, 'estimate');
    component.editSettings();
    component.pendingCostSettings.set({ origin: null, adults: 3, children: 1, comfort: 'luxury' });

    component.calculate();

    expect(upsert).toHaveBeenCalledWith(
      'ana@test.com', 'plan-1', 'Mi viaje', trip.stops(), trip.transits(),
      { costSettings: { origin: home, adults: 3, children: 1, comfort: 'luxury' } },
    );
    expect(estimate).not.toHaveBeenCalled();
    expect(component.costEditOpen()).toBe(false);
  });

  it('Cancelar closes the inline settings block, and the next save sends no costSettings', () => {
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true);
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: null } as any);
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    const fixture = TestBed.createComponent(StopListComponent);
    const cmp = fixture.componentInstance;
    cmp.editSettings();
    cmp.pendingCostSettings.set({ origin: null, adults: 4, children: 0, comfort: 'luxury' });
    fixture.detectChanges();

    const cancel = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.cost-edit-cancel');
    expect(cancel?.textContent).toContain('Cancelar');
    cancel!.click();
    fixture.detectChanges();
    expect(cmp.costEditOpen()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-cost-settings')).toBeNull();
    expect(upsert).not.toHaveBeenCalled();

    cmp.doBook();
    expect(upsert).toHaveBeenCalledWith('ana@test.com', 'plan-1', 'Mi viaje', trip.stops(), trip.transits(), {});
  });
});


describe('StopListComponent — cost card calculate as a collaborator (I4)', () => {
  let component: StopListComponent;
  let trip: TripService;
  let auth: AuthService;
  let savedPlans: SavedPlansService;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    savedPlans.register({ id: 'plan-1', name: 'Mi viaje', savedAt: '2026-10-22T00:00:00.000Z', stops: trip.stops(), transits: [], isCollaborator: true });
    trip.markAsLoadedPlan('plan-1');
    component = TestBed.createComponent(StopListComponent).componentInstance;
  });

  it('estimates the stored snapshot and never writes the collaborator home city into the trip', () => {
    const home: Place = { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' };
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: home } as any);
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    const estimate = jest.spyOn(savedPlans, 'estimate').mockReturnValue(of({} as any));

    component.calculate();

    expect(upsert).not.toHaveBeenCalled();
    expect(estimate).toHaveBeenCalledWith('plan-1');
  });
});

describe('StopListComponent — "Publicar viaje" on save (F74 feedback F2)', () => {
  let trip: TripService;
  let auth: AuthService;
  let savedPlans: SavedPlansService;
  let api: ApiService;
  let shareTrip: jest.SpyInstance;
  let fixture: ComponentFixture<StopListComponent>;
  let cmp: StopListComponent;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    auth = TestBed.inject(AuthService);
    savedPlans = TestBed.inject(SavedPlansService);
    api = TestBed.inject(ApiService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    jest.spyOn(auth, 'isLoggedIn').mockReturnValue(true);
    jest.spyOn(auth, 'currentUser').mockReturnValue({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null, homePlace: null } as any);
    shareTrip = jest.spyOn(api, 'shareTrip').mockReturnValue(of({ shareId: 'share-1' }));
  });

  function render(plan?: Partial<SavedPlan>): void {
    if (plan) {
      savedPlans.register({ id: 'plan-1', name: 'Mi viaje', savedAt: '2026-10-24T00:00:00.000Z', stops: trip.stops(), transits: [], ...plan });
      trip.markAsLoadedPlan('plan-1');
    }
    fixture = TestBed.createComponent(StopListComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const box = () => el().querySelector<HTMLInputElement>('.publish-check input[type="checkbox"]');

  it('new plan: the box starts checked and saving publishes the new id once', () => {
    render();
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('new-id'));
    const setShareId = jest.spyOn(savedPlans, 'setShareId');
    cmp.doBook();
    fixture.detectChanges();
    expect(box()?.checked).toBe(true);
    expect(el().textContent).toContain('Publicar viaje');

    cmp.bookName.set('Mi viaje');
    cmp.doBookSave();

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(shareTrip).toHaveBeenCalledTimes(1);
    expect(shareTrip).toHaveBeenCalledWith('new-id');
    expect(setShareId).toHaveBeenCalledWith('ana@test.com', 'new-id', 'share-1');
    expect(cmp.toast()).toBe('Viaje publicado');
  });

  it('new plan: unchecking the box saves without publishing', () => {
    render();
    jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('new-id'));
    cmp.doBook();
    fixture.detectChanges();
    box()!.click();
    fixture.detectChanges();
    expect(cmp.publishOnSave()).toBe(false);

    cmp.bookName.set('Mi viaje');
    cmp.doBookSave();

    expect(shareTrip).not.toHaveBeenCalled();
  });

  it('saved unpublished plan: the box starts unchecked and saving does not publish', () => {
    render({});
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    expect(box()).toBeTruthy();
    expect(box()!.checked).toBe(false);

    cmp.doBook();

    expect(upsert).toHaveBeenCalled();
    expect(shareTrip).not.toHaveBeenCalled();
  });

  it('saved unpublished plan: checking the box publishes on the next save', () => {
    render({});
    jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    box()!.click();

    cmp.doBook();

    expect(shareTrip).toHaveBeenCalledWith('plan-1');
  });

  it('published plan: shows "Publicado ✓" instead of the box', () => {
    render({ shareId: 'share-0' });
    expect(box()).toBeNull();
    expect(el().querySelector('.publish-done')?.textContent).toContain('Publicado ✓');
  });

  it('collaborator: neither the box nor "Publicado ✓"', () => {
    render({ isCollaborator: true });
    expect(box()).toBeNull();
    expect(el().querySelector('.publish-done')).toBeNull();
  });

  it('a background (autosave) save never publishes, even with the box checked', () => {
    render({});
    box()!.click();
    const upsert = jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('plan-1'));
    trip.addStop({ ...PARIS, id: 'lyon', name: 'Lyon' }, '06/06/2026', '08/06/2026');

    (TestBed.inject(AutoSaveService) as any).tick();

    expect(upsert).toHaveBeenCalledWith('ana@test.com', 'plan-1', 'Mi viaje', expect.anything(), expect.anything(), { background: true });
    expect(shareTrip).not.toHaveBeenCalled();
  });

  it('a publish failure keeps the save and shows the error toast', () => {
    render();
    jest.spyOn(savedPlans, 'upsert').mockReturnValue(of('new-id'));
    shareTrip.mockReturnValue(throwError(() => ({ status: 500 })));
    cmp.doBook();
    cmp.bookName.set('Mi viaje');

    cmp.doBookSave();

    expect(trip.loadedPlanId()).toBe('new-id');
    expect(cmp.bookOpen()).toBe(false);
    expect(cmp.toast()).toBe('No se pudo publicar el viaje');
  });
});

describe('StopListComponent — full plan toggle (2026-10-25)', () => {
  const TOKYO: City = { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'asia' };
  let trip: TripService;

  function setup(mobile: boolean, allowDeselect: boolean) {
    localStorage.clear();
    installMatchMediaMock(mobile);
    TestBed.configureTestingModule({
      imports: [StopListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    trip.addStop(TOKYO, '05/06/2026', '08/06/2026');
    const fixture = TestBed.createComponent(StopListComponent);
    fixture.componentRef.setInput('allowDeselect', allowDeselect);
    let emitted = 0;
    fixture.componentInstance.stopSelected.subscribe(() => emitted++);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const card = (i: number) => el.querySelectorAll<HTMLElement>('.stop-item')[i];
    return { fixture, el, card, emitted: () => emitted };
  }

  it('allowDeselect + desktop: clicking the active card unselects it', () => {
    const { card } = setup(false, true);
    const tokyo = trip.stops()[1].stopId;
    expect(trip.activeId()).toBe(tokyo);
    card(1).click();
    expect(trip.activeStop()).toBeNull();
    card(0).click();
    expect(trip.activeStop()?.cityId).toBe('paris');
  });

  it('allowDeselect=false (landing default): clicking the active card keeps it selected and still emits stopSelected', () => {
    const { card, emitted } = setup(false, false);
    card(1).click();
    expect(trip.activeStop()?.cityId).toBe('tokyo');
    expect(emitted()).toBe(1);
  });

  it('mobile: clicking the active card keeps it selected even with allowDeselect', () => {
    const { card } = setup(true, true);
    card(1).click();
    expect(trip.activeStop()?.cityId).toBe('tokyo');
  });

  it('"Ver plan completo" shows only with allowDeselect on desktop, primary + pressed when nothing is selected, ghost when a city is', () => {
    expect(setup(false, false).el.querySelector('.tfp-view-btn')).toBeNull();
    TestBed.resetTestingModule();
    expect(setup(true, true).el.querySelector('.tfp-view-btn')).toBeNull();
    TestBed.resetTestingModule();
    const { fixture, el } = setup(false, true);
    let btn = el.querySelector('.tfp-view-btn')!;
    expect(btn.classList).toContain('btn-ghost');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    trip.clearActive();
    fixture.detectChanges();
    btn = el.querySelector('.tfp-view-btn')!;
    expect(btn.classList).toContain('btn-primary');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('"Ver plan completo" click calls clearActive()', () => {
    const { el } = setup(false, true);
    const spy = jest.spyOn(trip, 'clearActive');
    (el.querySelector('.tfp-view-btn') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
    expect(trip.activeStop()).toBeNull();
  });

  it('mobile FAB scrolls to the page top when no city is active', () => {
    const { fixture } = setup(true, true);
    trip.clearActive();
    fixture.detectChanges();
    const scrollTo = jest.fn();
    (window as any).scrollTo = scrollTo;
    (fixture.componentInstance as any).scrollToActiveCity();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
