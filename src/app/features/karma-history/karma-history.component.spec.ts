import { signal, computed } from '@angular/core';
import { TestBed, NO_ERRORS_SCHEMA } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { KarmaHistoryComponent } from './karma-history.component';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';
import { AutoSaveService } from '../../core/saved-plans/auto-save.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { DeviceService } from '../../core/device/device.service';

function mockAutoSave(): Partial<AutoSaveService> {
  return {
    commitSnapshot: jest.fn(),
    enabled: jest.fn().mockReturnValue(true) as unknown as AutoSaveService['enabled'],
    showReminderNow: jest.fn(),
  };
}

describe('KarmaHistoryComponent', () => {
  function setup(apiOverrides: Partial<ApiService> = {}, plans: any[] = []) {
    const isMobileSignal = signal(false);
    const mockApiService = {
      getKarmaEvents: jest.fn().mockReturnValue(of({ events: [], nextCursor: null })),
      getKarma: jest.fn().mockReturnValue(of({ karma: 100 })),
      getTrips: jest.fn().mockReturnValue(of({ trips: [] })),
      getSharedTrip: jest.fn().mockReturnValue(of({})),
      getPendingInvites: jest.fn().mockReturnValue(of({ invites: [] })),
      getFavorites: jest.fn().mockReturnValue(of({ trips: [] })),
      searchSharedTrips: jest.fn().mockReturnValue(of({ trips: [] })),
      getFeatured: jest.fn().mockReturnValue(of({ trips: [] })),
      getStats: jest.fn().mockReturnValue(of({ cities: 0, users: 0, plans: 0 })),
      ...apiOverrides,
    };
    const mockNavFacade = {
      openMyTrips: jest.fn(),
      buyKarmaOpen: () => false,
      karmaModal: { mpConfirm: () => null, closeBuy: jest.fn(), insufficientOpen: () => false },
      karmaSuccessOpen: () => false,
      dismissKarmaSuccess: jest.fn(),
      karma: { karma: () => 100 },
      authModal: { openLogin: jest.fn() },
    };
    TestBed.configureTestingModule({
      imports: [KarmaHistoryComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }), isLoggedIn: jest.fn().mockReturnValue(true) } },
        { provide: SavedPlansService, useValue: { plans: signal(plans) } },
        { provide: ApiService, useValue: mockApiService },
        { provide: NavFacadeService, useValue: mockNavFacade },
        { provide: AutoSaveService, useValue: mockAutoSave() },
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      remove: { imports: [NavShellComponent, ProfileComponent] },
    });
    const fixture = TestBed.createComponent(KarmaHistoryComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the empty state when the first page has no events', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes movimientos de karma');
  });

  it('renders a natural-language label and delta for each event', () => {
    const fixture = setup({
      getKarmaEvents: jest.fn().mockReturnValue(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: null }],
        nextCursor: null,
      })),
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Viaje creado');
    expect(text).toContain('-1');
  });

  it('shows "Ir al viaje" only when target.type is trip, and hides it otherwise', () => {
    const fixture = setup({
      getKarmaEvents: jest.fn().mockReturnValue(of({
        events: [
          { eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: { type: 'trip', id: 't1' } },
          { eventId: 'e2', delta: -9, reason: 'ai_suggest', createdAt: '2026-09-10T00:00:00.000Z', target: null },
        ],
        nextCursor: null,
      })),
    });
    const buttons = [...fixture.nativeElement.querySelectorAll('.karma-history-action')].map((b: HTMLElement) => b.textContent);
    expect(buttons.some(t => t?.includes('Ir al viaje'))).toBe(true);
    expect(buttons).toHaveLength(1);
  });

  it('shows "Cargar más" only when nextCursor is present, and appends the next page on click', () => {
    const getKarmaEvents = jest.fn()
      .mockReturnValueOnce(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: null }],
        nextCursor: 'cursor-1',
      }))
      .mockReturnValueOnce(of({
        events: [{ eventId: 'e2', delta: 3, reason: 'karma_purchased', createdAt: '2026-09-09T00:00:00.000Z', target: null }],
        nextCursor: null,
      }));
    const fixture = setup({ getKarmaEvents });

    const loadMoreBtn = fixture.nativeElement.querySelector('.karma-history-load-more');
    expect(loadMoreBtn).not.toBeNull();

    loadMoreBtn.click();
    fixture.detectChanges();

    expect(getKarmaEvents).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelectorAll('.karma-history-row')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.karma-history-load-more')).toBeNull();
  });

  it('goToTrip loads the found plan into TripService and navigates home', () => {
    const restoreStops = jest.fn();
    const setActive = jest.fn();
    const navigate = jest.fn();
    const isMobileSignal = signal(false);
    const mockApiService = {
      getKarmaEvents: jest.fn().mockReturnValue(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: { type: 'trip', id: 'trip-1' } }],
        nextCursor: null,
      })),
      getKarma: jest.fn().mockReturnValue(of({ karma: 100 })),
      getTrips: jest.fn().mockReturnValue(of({ trips: [] })),
      getSharedTrip: jest.fn().mockReturnValue(of({})),
      getPendingInvites: jest.fn().mockReturnValue(of({ invites: [] })),
      getFavorites: jest.fn().mockReturnValue(of({ trips: [] })),
      searchSharedTrips: jest.fn().mockReturnValue(of({ trips: [] })),
      getFeatured: jest.fn().mockReturnValue(of({ trips: [] })),
      getStats: jest.fn().mockReturnValue(of({ cities: 0, users: 0, plans: 0 })),
    };
    TestBed.configureTestingModule({
      imports: [KarmaHistoryComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, navigateByUrl: jest.fn(), url: '/' } },
        { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }) } },
        { provide: SavedPlansService, useValue: { plans: signal([{ id: 'trip-1', name: 'Paris', stops: [{ stopId: 's1' }], transits: [], isCollaborator: false }]) } },
        { provide: TripService, useValue: { restoreStops, setActive } },
        { provide: NavFacadeService, useValue: { openMyTrips: jest.fn(), buyKarmaOpen: () => false, karmaModal: { mpConfirm: () => null, closeBuy: jest.fn(), insufficientOpen: () => false }, karmaSuccessOpen: () => false, dismissKarmaSuccess: jest.fn(), karma: { karma: () => 100 }, authModal: { openLogin: jest.fn() } } },
        { provide: AutoSaveService, useValue: mockAutoSave() },
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
        { provide: ApiService, useValue: mockApiService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      remove: { imports: [NavShellComponent, ProfileComponent] },
    });
    const fixture = TestBed.createComponent(KarmaHistoryComponent);
    fixture.detectChanges();

    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();

    expect(restoreStops).toHaveBeenCalledWith([{ stopId: 's1' }], 'trip-1', [], null);
    expect(setActive).toHaveBeenCalledWith('s1');
    expect(navigate).toHaveBeenCalledWith(['/']);
    // getTrips fallback must not be consulted when the plan is already found locally.
    expect(mockApiService.getTrips).not.toHaveBeenCalled();
  });

  function setupGoToTripFallback(getTripsImpl: () => Observable<unknown>, extra: { restoreStops?: jest.Mock; setActive?: jest.Mock } = {}) {
    const navigate = jest.fn();
    const isMobileSignal = signal(false);
    const restoreStops = extra.restoreStops ?? jest.fn();
    const setActive = extra.setActive ?? jest.fn();
    const mockApiService = {
      getKarmaEvents: jest.fn().mockReturnValue(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: { type: 'trip', id: 'trip-missing' } }],
        nextCursor: null,
      })),
      getKarma: jest.fn().mockReturnValue(of({ karma: 100 })),
      getTrips: jest.fn().mockImplementation(getTripsImpl),
      getSharedTrip: jest.fn().mockReturnValue(of({})),
      getPendingInvites: jest.fn().mockReturnValue(of({ invites: [] })),
      getFavorites: jest.fn().mockReturnValue(of({ trips: [] })),
      searchSharedTrips: jest.fn().mockReturnValue(of({ trips: [] })),
      getFeatured: jest.fn().mockReturnValue(of({ trips: [] })),
      getStats: jest.fn().mockReturnValue(of({ cities: 0, users: 0, plans: 0 })),
    };
    TestBed.configureTestingModule({
      imports: [KarmaHistoryComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, navigateByUrl: jest.fn(), url: '/' } },
        { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }), isLoggedIn: jest.fn().mockReturnValue(true) } },
        { provide: SavedPlansService, useValue: { plans: signal([]) } },
        { provide: TripService, useValue: { restoreStops, setActive } },
        { provide: NavFacadeService, useValue: { openMyTrips: jest.fn(), buyKarmaOpen: () => false, karmaModal: { mpConfirm: () => null, closeBuy: jest.fn(), insufficientOpen: () => false }, karmaSuccessOpen: () => false, dismissKarmaSuccess: jest.fn(), karma: { karma: () => 100 }, authModal: { openLogin: jest.fn() } } },
        { provide: AutoSaveService, useValue: mockAutoSave() },
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
        { provide: ApiService, useValue: mockApiService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      remove: { imports: [NavShellComponent, ProfileComponent] },
    });
    const fixture = TestBed.createComponent(KarmaHistoryComponent);
    fixture.detectChanges();
    return { fixture, navigate, restoreStops, setActive, mockApiService };
  }

  it('goToTrip falls back to a fresh ApiService.getTrips() lookup, and shows a toast when not found there either', () => {
    const { fixture, navigate, mockApiService } = setupGoToTripFallback(() => of([]));

    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();
    fixture.detectChanges();

    expect(mockApiService.getTrips).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No se pudo abrir el viaje');
  });

  it('goToTrip finds the trip via the ApiService.getTrips() fallback and navigates home', () => {
    const trip = { id: 'trip-missing', title: 'Rome', stops: [{ stopId: 's9' }], transits: [], isCollaborator: false };
    const { fixture, navigate, restoreStops, setActive } = setupGoToTripFallback(() => of([trip]));

    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();
    fixture.detectChanges();

    expect(restoreStops).toHaveBeenCalledWith([{ stopId: 's9' }], 'trip-missing', [], null);
    expect(setActive).toHaveBeenCalledWith('s9');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('goToTrip shows a toast when the ApiService.getTrips() fallback itself errors', () => {
    const { fixture, navigate } = setupGoToTripFallback(() => throwError(() => new Error('network')));
    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No se pudo abrir el viaje');
  });

  describe('load error state', () => {
    function setupWithError() {
      const isMobileSignal = signal(false);
      const getKarmaEvents = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
      const mockApiService = {
        getKarmaEvents,
        getKarma: jest.fn().mockReturnValue(of({ karma: 100 })),
        getTrips: jest.fn().mockReturnValue(of([])),
        getSharedTrip: jest.fn().mockReturnValue(of({})),
        getPendingInvites: jest.fn().mockReturnValue(of({ invites: [] })),
        getFavorites: jest.fn().mockReturnValue(of({ trips: [] })),
        searchSharedTrips: jest.fn().mockReturnValue(of({ trips: [] })),
        getFeatured: jest.fn().mockReturnValue(of({ trips: [] })),
        getStats: jest.fn().mockReturnValue(of({ cities: 0, users: 0, plans: 0 })),
      };
      const mockNavFacade = {
        openMyTrips: jest.fn(),
        buyKarmaOpen: () => false,
        karmaModal: { mpConfirm: () => null, closeBuy: jest.fn(), insufficientOpen: () => false },
        karmaSuccessOpen: () => false,
        dismissKarmaSuccess: jest.fn(),
        karma: { karma: () => 100 },
        authModal: { openLogin: jest.fn() },
      };
      TestBed.configureTestingModule({
        imports: [KarmaHistoryComponent],
        providers: [
          provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
          { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }), isLoggedIn: jest.fn().mockReturnValue(true) } },
          { provide: SavedPlansService, useValue: { plans: signal([]) } },
          { provide: ApiService, useValue: mockApiService },
          { provide: NavFacadeService, useValue: mockNavFacade },
          { provide: AutoSaveService, useValue: mockAutoSave() },
          { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).overrideComponent(KarmaHistoryComponent, {
        remove: { imports: [NavShellComponent, ProfileComponent] },
      });
      const fixture = TestBed.createComponent(KarmaHistoryComponent);
      fixture.detectChanges();
      return { fixture, getKarmaEvents };
    }

    it('shows the error state (not the empty state) when the first load fails', () => {
      const { fixture } = setupWithError();
      expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tu historial de karma');
      expect(fixture.nativeElement.textContent).not.toContain('Aún no tienes movimientos de karma');
    });

    it('retry() re-issues the first-page load and clears the error state on success', () => {
      const { fixture, getKarmaEvents } = setupWithError();
      getKarmaEvents.mockReturnValue(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: null }],
        nextCursor: null,
      }));

      const retryBtn: HTMLElement = fixture.nativeElement.querySelector('.section-empty button');
      retryBtn.click();
      fixture.detectChanges();

      expect(getKarmaEvents).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.textContent).not.toContain('No pudimos cargar tu historial de karma');
      expect(fixture.nativeElement.textContent).toContain('Viaje creado');
    });
  });
});
