import { signal, computed } from '@angular/core';
import { TestBed, NO_ERRORS_SCHEMA } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { KarmaHistoryComponent } from './karma-history.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { DeviceService } from '../../core/device/device.service';

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
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      set: {
        template: `
          <div class="prof-bar"><button class="back-btn" (click)="goHome()" type="button">← Volver</button></div>
          <div class="prof-body">
            <section>
              @if (loading() && events().length === 0) {
                <div class="section-empty">Cargando tu historial…</div>
              } @else if (events().length === 0) {
                <div class="section-empty">Aún no tienes movimientos de karma.</div>
              } @else {
                <div class="karma-history-list">
                  @for (event of events(); track event.eventId) {
                    <div class="karma-history-row">
                      <div class="karma-history-main">
                        <span class="karma-history-label">{{ karmaReasonLabel(event.reason) }}</span>
                        <span class="karma-history-date">{{ event.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <span class="karma-history-delta" [class.karma-history-delta-pos]="event.delta > 0">
                        {{ event.delta > 0 ? '+' : '' }}{{ event.delta }} ✨
                      </span>
                      @if (event.target?.type === 'trip') {
                        <button class="btn-pill btn-outline karma-history-action" (click)="goToTrip(event.target!.id)" type="button">Ir al viaje</button>
                      } @else if (event.target?.type === 'ai_plan_request') {
                        <button class="btn-pill btn-outline karma-history-action" (click)="goToAiPlan()" type="button">Ir al plan de IA</button>
                      }
                    </div>
                  }
                </div>
                @if (nextCursor()) {
                  <button class="btn-pill btn-ghost karma-history-load-more" [disabled]="loading()" (click)="loadMore()" type="button">
                    {{ loading() ? '⏳' : '' }} Cargar más
                  </button>
                }
              }
            </section>
          </div>
          @if (toast()) {
            <app-toast [message]="toast()!" (done)="toast.set(null)" />
          }
        `
      }
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
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
        { provide: ApiService, useValue: mockApiService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      set: { template: `<div class="prof-bar"><button class="back-btn" (click)="goHome()" type="button">← Volver</button></div><div class="prof-body"><section>@if (loading() && events().length === 0) { <div class="section-empty">Cargando…</div> } @else if (events().length === 0) { <div class="section-empty">Aún no tienes movimientos de karma.</div> } @else { <div class="karma-history-list">@for (event of events(); track event.eventId) { <div class="karma-history-row"><div class="karma-history-main"><span class="karma-history-label">{{ karmaReasonLabel(event.reason) }}</span></div><span class="karma-history-delta" [class.karma-history-delta-pos]="event.delta > 0">{{ event.delta > 0 ? '+' : '' }}{{ event.delta }} ✨</span>@if (event.target?.type === 'trip') { <button class="karma-history-action" (click)="goToTrip(event.target!.id)" type="button">Ir al viaje</button> }@if (event.target?.type === 'ai_plan_request') { <button class="karma-history-action" (click)="goToAiPlan()" type="button">Ir al plan de IA</button> }</div> }@if (nextCursor()) { <button class="karma-history-load-more" [disabled]="loading()" (click)="loadMore()" type="button">Cargar más</button> }</div> }</section></div>@if (toast()) { <app-toast [message]="toast()!" (done)="toast.set(null)" /> }` }
    });
    const fixture = TestBed.createComponent(KarmaHistoryComponent);
    fixture.detectChanges();

    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();

    expect(restoreStops).toHaveBeenCalledWith([{ stopId: 's1' }], 'trip-1', [], null);
    expect(setActive).toHaveBeenCalledWith('s1');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('goToTrip shows a toast instead of navigating when the plan is not in savedPlans', () => {
    const navigate = jest.fn();
    const isMobileSignal = signal(false);
    const mockApiService = {
      getKarmaEvents: jest.fn().mockReturnValue(of({
        events: [{ eventId: 'e1', delta: -1, reason: 'trip_created', createdAt: '2026-09-10T00:00:00.000Z', target: { type: 'trip', id: 'trip-missing' } }],
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
        { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: null }), isLoggedIn: jest.fn().mockReturnValue(true) } },
        { provide: SavedPlansService, useValue: { plans: signal([]) } },
        { provide: NavFacadeService, useValue: { openMyTrips: jest.fn(), buyKarmaOpen: () => false, karmaModal: { mpConfirm: () => null, closeBuy: jest.fn(), insufficientOpen: () => false }, karmaSuccessOpen: () => false, dismissKarmaSuccess: jest.fn(), karma: { karma: () => 100 }, authModal: { openLogin: jest.fn() } } },
        { provide: DeviceService, useValue: { isMobile: isMobileSignal, isDesktop: computed(() => !isMobileSignal()) } },
        { provide: ApiService, useValue: mockApiService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(KarmaHistoryComponent, {
      set: { template: `<div class="prof-bar"><button class="back-btn" (click)="goHome()" type="button">← Volver</button></div><div class="prof-body"><section>@if (loading() && events().length === 0) { <div class="section-empty">Cargando…</div> } @else if (events().length === 0) { <div class="section-empty">Aún no tienes movimientos de karma.</div> } @else { <div class="karma-history-list">@for (event of events(); track event.eventId) { <div class="karma-history-row"><div class="karma-history-main"><span class="karma-history-label">{{ karmaReasonLabel(event.reason) }}</span></div><span class="karma-history-delta" [class.karma-history-delta-pos]="event.delta > 0">{{ event.delta > 0 ? '+' : '' }}{{ event.delta }} ✨</span>@if (event.target?.type === 'trip') { <button class="karma-history-action" (click)="goToTrip(event.target!.id)" type="button">Ir al viaje</button> }@if (event.target?.type === 'ai_plan_request') { <button class="karma-history-action" (click)="goToAiPlan()" type="button">Ir al plan de IA</button> }</div> }@if (nextCursor()) { <button class="karma-history-load-more" [disabled]="loading()" (click)="loadMore()" type="button">Cargar más</button> }</div> }</section></div>@if (toast()) { <app-toast [message]="toast()!" (done)="toast.set(null)" /> }` }
    });
    const fixture = TestBed.createComponent(KarmaHistoryComponent);
    fixture.detectChanges();

    const btn: HTMLElement = fixture.nativeElement.querySelector('.karma-history-action');
    btn.click();
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No se pudo abrir el viaje');
  });
});
