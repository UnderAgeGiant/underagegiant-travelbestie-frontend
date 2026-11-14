import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { FirstPlanService } from './first-plan.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { SavedPlansService } from '../saved-plans/saved-plans.service';
import { AutoSaveService } from '../saved-plans/auto-save.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { ToastService } from '../ui/toast.service';
import { TripService } from '../../features/trip/trip.service';
import { NavFacadeService } from '../../features/nav/nav-facade.service';

describe('FirstPlanService', () => {
  let svc: FirstPlanService;
  let gift: ReturnType<typeof signal<boolean>>;
  let stops: ReturnType<typeof signal<unknown[]>>;
  let loadedPlanId: ReturnType<typeof signal<string | null>>;
  const auth = { firstPlanAvailable: () => gift(), setFirstPlanAvailable: jest.fn((v: boolean) => gift.set(v)), currentUser: () => ({ email: 'ana@test.com' }) };
  const api = { cloneSharedTrip: jest.fn() };
  const savedPlans = { register: jest.fn(), upsert: jest.fn() };
  const trip = {
    stops: () => stops(), transits: () => [], loadedPlanId: () => loadedPlanId(),
    restoreStops: jest.fn(), markAsLoadedPlan: jest.fn((id: string) => loadedPlanId.set(id)),
  };
  const router = { navigate: jest.fn() };
  const facade = { openEditor: jest.fn() };
  const autoSave = { commitSnapshot: jest.fn() };
  const karmaModal = { handleKarmaError: jest.fn((e: { status?: number }) => e?.status === 402) };
  const toast = { show: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    gift = signal(true);
    stops = signal<unknown[]>([]);
    loadedPlanId = signal<string | null>(null);
    TestBed.configureTestingModule({
      providers: [
        FirstPlanService,
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api },
        { provide: SavedPlansService, useValue: savedPlans },
        { provide: TripService, useValue: trip },
        { provide: Router, useValue: router },
        { provide: NavFacadeService, useValue: facade },
        { provide: AutoSaveService, useValue: autoSave },
        { provide: KarmaModalService, useValue: karmaModal },
        { provide: ToastService, useValue: toast },
      ],
    });
    svc = TestBed.inject(FirstPlanService);
  });

  it('afterLogin without the gift drops the intent and does nothing', () => {
    gift.set(false);
    svc.setSignupIntent({ kind: 'city', cityId: 'paris' });
    svc.afterLogin();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(svc.takeSignupIntent()).toBeNull();
  });

  it('shared intent clones for free and opens the editor', fakeAsync(() => {
    api.cloneSharedTrip.mockReturnValue(of({ id: 'c1', title: 'Copia', stops: [{ cityId: 'rome' }], transits: [] }));
    svc.setSignupIntent({ kind: 'shared', shareId: 's1' });
    svc.afterLogin();
    tick(FirstPlanService.CLONING_MIN_MS);
    expect(api.cloneSharedTrip).toHaveBeenCalledWith('s1', 'shared');
    expect(savedPlans.register).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', name: 'Copia' }));
    expect(trip.restoreStops).toHaveBeenCalledWith([{ cityId: 'rome' }], 'c1', []);
    expect(gift()).toBe(false);
    expect(facade.openEditor).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('the waiting popup is up while the shared clone runs, for at least CLONING_MIN_MS, and closes as the editor opens', fakeAsync(() => {
    const clone$ = new Subject<unknown>();
    api.cloneSharedTrip.mockReturnValue(clone$);
    svc.setSignupIntent({ kind: 'shared', shareId: 's1' });
    svc.afterLogin();
    expect(svc.cloningShared()).toBe(true);
    clone$.next({ id: 'c1', title: 'Copia', stops: [], transits: [] });
    clone$.complete();
    tick(FirstPlanService.CLONING_MIN_MS - 1);
    expect(svc.cloningShared()).toBe(true);
    expect(facade.openEditor).not.toHaveBeenCalled();
    tick(1);
    expect(facade.openEditor).toHaveBeenCalled();
    expect(svc.cloningShared()).toBe(false);
  }));

  it('a failed shared clone closes the popup at once and falls back to the AI screen', fakeAsync(() => {
    const clone$ = new Subject<unknown>();
    api.cloneSharedTrip.mockReturnValue(clone$);
    svc.setSignupIntent({ kind: 'shared', shareId: 'gone' });
    svc.afterLogin();
    clone$.error({ status: 404 });
    expect(svc.cloningShared()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/ai-planning'], { queryParams: {} });
    tick(FirstPlanService.CLONING_MIN_MS);
  }));

  it('no popup without a shared intent', () => {
    svc.setSignupIntent({ kind: 'city', cityId: 'paris' });
    svc.afterLogin();
    expect(svc.cloningShared()).toBe(false);
  });

  it('shared intent 404 falls back to the AI screen', () => {
    api.cloneSharedTrip.mockReturnValue(throwError(() => ({ status: 404 })));
    svc.setSignupIntent({ kind: 'shared', shareId: 'gone' });
    svc.afterLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/ai-planning'], { queryParams: {} });
    expect(gift()).toBe(true);
  });

  it('draft with stops is saved as "Mi primer viaje" and the AI screen does not open', () => {
    stops.set([{ cityId: 'paris' }]);
    savedPlans.upsert.mockReturnValue(of('p1'));
    svc.afterLogin();
    expect(savedPlans.upsert).toHaveBeenCalledWith('ana@test.com', null, 'Mi primer viaje', [{ cityId: 'paris' }], []);
    expect(trip.markAsLoadedPlan).toHaveBeenCalledWith('p1');
    expect(autoSave.commitSnapshot).toHaveBeenCalledWith('p1');
    expect(gift()).toBe(false);
    expect(toast.show).toHaveBeenCalledWith('Guardado en tu cuenta ✓');
    expect(facade.openEditor).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('saves the draft once when called twice (doBook callback + afterLogin)', () => {
    stops.set([{ cityId: 'paris' }]);
    const inFlight = new Subject<string>();
    savedPlans.upsert.mockReturnValue(inFlight);
    svc.saveFirstManualPlan().subscribe();
    svc.afterLogin();
    inFlight.next('p1');
    inFlight.complete();
    expect(savedPlans.upsert).toHaveBeenCalledTimes(1);
    expect(trip.markAsLoadedPlan).toHaveBeenCalledTimes(1);
    expect(facade.openEditor).toHaveBeenCalledTimes(1);
    svc.saveFirstManualPlan().subscribe(id => expect(id).toBe('p1'));
    expect(savedPlans.upsert).toHaveBeenCalledTimes(1);
  });

  it('a 402 on the hand-built save opens the Token modal and clears the flag', () => {
    stops.set([{ cityId: 'paris' }]);
    const err = { status: 402 };
    savedPlans.upsert.mockReturnValue(throwError(() => err));
    svc.saveFirstManualPlan().subscribe({ error: () => {} });
    expect(karmaModal.handleKarmaError).toHaveBeenCalledWith(err);
    expect(gift()).toBe(false);
  });

  it('auto-open happens once per session', () => {
    svc.afterLogin();
    svc.afterLogin();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('city intent opens /ai-planning?city=…', () => {
    svc.setSignupIntent({ kind: 'city', cityId: 'paris' });
    svc.afterLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/ai-planning'], { queryParams: { city: 'paris' } });
  });
});
