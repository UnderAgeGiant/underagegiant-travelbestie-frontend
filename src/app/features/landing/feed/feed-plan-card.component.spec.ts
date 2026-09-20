import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FeedPlanCardComponent } from './feed-plan-card.component';
import { TripMapComponent, TripMapCity } from '../../../shared/trip-map/trip-map.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { FavoritesService } from '../../../core/favorites/favorites.service';
import { ToastService } from '../../../core/ui/toast.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { FeedPlan } from '../../../core/models/feed-plan.model';

jest.mock('../../../data/attractions.data', () => ({
  findCuratedAttraction: (_c: string, id: string) => ({
    id, name: `Name ${id}`, type: 'Histórico', category: 'poi', active: true, icon: '🏛️', bg: '#E8F0FD',
    rating: 4.5, estimatedMinutes: 60, imageUrl: `https://img/${id}.jpg`,
  }),
  getAttractions: () => [],
}));

@Component({ selector: 'app-trip-map', template: '' })
class TripMapStub {
  readonly cities = input.required<TripMapCity[]>();
  readonly interactive = input(true);
  readonly showFlightPath = input(true);
  readonly showLabels = input(true);
}

const planWith = (n: number): FeedPlan => ({
  id: 'p1', tripName: 'Roma y Florencia', ownerName: 'Camila', createdAt: '2026-09-01T00:00:00Z', favoriteCount: 12,
  stops: [
    { cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: Array.from({ length: n }, (_, i) => ({ attractionId: `paris_${i}`, startTime: null, endTime: null })) },
  ],
});

describe('FeedPlanCardComponent', () => {
  let fixture: ComponentFixture<FeedPlanCardComponent>;
  let router: { navigate: jest.Mock };
  let auth: { isLoggedIn: jest.Mock };
  let authModal: { openLogin: jest.Mock };
  let favorites: { isFavorited: jest.Mock; toggle: jest.Mock; loadFavorites: jest.Mock };
  let toast: { show: jest.Mock };

  const create = (plan: FeedPlan, active = false) => {
    fixture = TestBed.createComponent(FeedPlanCardComponent);
    fixture.componentRef.setInput('plan', plan);
    fixture.componentRef.setInput('active', active);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const activePane = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.feed-pane')).findIndex(p => p.classList.contains('active'));

  beforeEach(() => {
    jest.useFakeTimers();
    router = { navigate: jest.fn() };
    auth = { isLoggedIn: jest.fn(() => false) };
    authModal = { openLogin: jest.fn() };
    favorites = { isFavorited: jest.fn(() => false), toggle: jest.fn(), loadFavorites: jest.fn() };
    toast = { show: jest.fn() };
    TestBed.configureTestingModule({
      imports: [FeedPlanCardComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: AuthModalService, useValue: authModal },
        { provide: FavoritesService, useValue: favorites },
        { provide: ToastService, useValue: toast },
        { provide: LocaleService, useValue: { current: () => 'es-CL' } },
      ],
    });
    TestBed.overrideComponent(FeedPlanCardComponent, { remove: { imports: [TripMapComponent] }, add: { imports: [TripMapStub] } });
  });
  afterEach(() => jest.useRealTimers());

  it('page 0 is the map, fed the plan cities non-interactively; slides follow', () => {
    const el = create(planWith(3));
    expect(el.querySelectorAll('.feed-pane')).toHaveLength(4);            // map + 3 slides
    const map = fixture.debugElement.query(By.directive(TripMapStub)).componentInstance as TripMapStub;
    expect(map.cities()).toEqual([{ cityId: 'paris' }]);
    expect(map.interactive()).toBe(false);
    expect(activePane(el)).toBe(0);
  });

  it('next/prev buttons move between pages and wrap around', () => {
    const el = create(planWith(2));                                       // 3 pages
    const next = el.querySelector('.feed-nav-next') as HTMLButtonElement;
    const prev = el.querySelector('.feed-nav-prev') as HTMLButtonElement;
    next.click(); fixture.detectChanges(); expect(activePane(el)).toBe(1);
    next.click(); next.click(); fixture.detectChanges(); expect(activePane(el)).toBe(0);   // wrapped
    prev.click(); fixture.detectChanges(); expect(activePane(el)).toBe(2);                 // wrapped back
  });

  it('supports ArrowRight/ArrowLeft and a horizontal swipe', () => {
    const el = create(planWith(2));
    const card = el.querySelector('.feed-card') as HTMLElement;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); fixture.detectChanges();
    expect(activePane(el)).toBe(1);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); fixture.detectChanges();
    expect(activePane(el)).toBe(0);
    card.dispatchEvent(new MouseEvent('pointerdown', { clientX: 200 }));
    card.dispatchEvent(new MouseEvent('pointerup',   { clientX: 100 })); fixture.detectChanges();
    expect(activePane(el)).toBe(1);                                       // swipe left = next
  });

  it('auto-advances every 5 s only while active', () => {
    const el = create(planWith(2), true);
    jest.advanceTimersByTime(5000); fixture.detectChanges();
    expect(activePane(el)).toBe(1);
    fixture.componentRef.setInput('active', false); fixture.detectChanges();
    jest.advanceTimersByTime(15000); fixture.detectChanges();
    expect(activePane(el)).toBe(1);                                       // stopped
  });

  it('pauses auto-advance on hover', () => {
    const el = create(planWith(2), true);
    (el.querySelector('.feed-card') as HTMLElement).dispatchEvent(new MouseEvent('pointerenter'));
    fixture.detectChanges();
    jest.advanceTimersByTime(10000); fixture.detectChanges();
    expect(activePane(el)).toBe(0);
  });

  it('a plan with no attractions is map-only (no nav controls)', () => {
    const el = create(planWith(0), true);
    expect(el.querySelectorAll('.feed-pane')).toHaveLength(1);
    expect(el.querySelector('.feed-nav')).toBeNull();
    jest.advanceTimersByTime(20000); fixture.detectChanges();
    expect(activePane(el)).toBe(0);
  });

  it('renders <img> only for pages within ±1 of the current page', () => {
    const el = create(planWith(5));                                       // pages 0..5, currently 0
    expect(el.querySelectorAll('img.feed-photo')).toHaveLength(1);        // page 1 only
  });

  it('♥ when anonymous opens the login modal and does NOT toggle, even after login', () => {
    const el = create(planWith(1));
    (el.querySelector('.feed-heart') as HTMLButtonElement).click();
    expect(authModal.openLogin).toHaveBeenCalledTimes(1);
    expect(favorites.toggle).not.toHaveBeenCalled();
    const afterLogin = authModal.openLogin.mock.calls[0][0] as () => void;
    afterLogin();
    expect(favorites.toggle).not.toHaveBeenCalled();
    expect(favorites.loadFavorites).toHaveBeenCalled();
  });

  it('♥ when logged in toggles with tripMeta and shows the server count', () => {
    auth.isLoggedIn.mockReturnValue(true);
    favorites.toggle.mockImplementation((_id: string, ok: (r: { favorited: boolean; favoriteCount: number }) => void) =>
      ok({ favorited: true, favoriteCount: 42 }));
    const el = create(planWith(1));
    expect((el.querySelector('.feed-heart-count') as HTMLElement).textContent).toContain('12');
    (el.querySelector('.feed-heart') as HTMLButtonElement).click(); fixture.detectChanges();
    const args = favorites.toggle.mock.calls[0];
    expect(args[0]).toBe('p1');
    expect(args[3]).toMatchObject({ tripName: 'Roma y Florencia', ownerName: 'Camila', transits: [], favoriteCount: 12 });
    expect((el.querySelector('.feed-heart-count') as HTMLElement).textContent).toContain('42');
  });

  it('♥ error shows a toast', () => {
    auth.isLoggedIn.mockReturnValue(true);
    favorites.toggle.mockImplementation((_id: string, _ok: unknown, err: () => void) => err());
    const el = create(planWith(1));
    (el.querySelector('.feed-heart') as HTMLButtonElement).click();
    expect(toast.show).toHaveBeenCalled();
  });

  it('"Ver plan completo" navigates to the shared plan', () => {
    const el = create(planWith(1));
    (el.querySelector('.feed-view-plan') as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/shared', 'p1']);
  });
});
