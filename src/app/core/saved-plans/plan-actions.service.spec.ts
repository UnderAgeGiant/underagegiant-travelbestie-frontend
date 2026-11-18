import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PlanActionsService } from './plan-actions.service';
import { SavedPlansService, SavedPlan } from './saved-plans.service';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { KarmaService } from '../karma/karma.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { ToastService } from '../ui/toast.service';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { __setAttractionSourceForTests } from '../../data/attractions.data';

(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

const plan = (over: Partial<SavedPlan> = {}): SavedPlan => ({
  id: 'p1', name: 'Paris trip', savedAt: '2026-07-01T00:00:00Z', stops: [], ...over,
});

describe('PlanActionsService', () => {
  let svc: PlanActionsService;
  let api: ApiService;
  let karma: KarmaService;
  let karmaModal: KarmaModalService;
  let savedPlans: SavedPlansService;
  let toast: ToastService;
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    __setAttractionSourceForTests(null);
    (URL as any).createObjectURL = jest.fn(() => 'blob:x');
    (URL as any).revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }) as unknown as typeof fetch;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(AuthService).setTokens('fake-jwt', { name: 'Test User', email: 'test@example.com' });
    svc = TestBed.inject(PlanActionsService);
    api = TestBed.inject(ApiService);
    karma = TestBed.inject(KarmaService);
    karmaModal = TestBed.inject(KarmaModalService);
    savedPlans = TestBed.inject(SavedPlansService);
    toast = TestBed.inject(ToastService);
    jest.spyOn(TestBed.inject(VisaRequirementService), 'load').mockResolvedValue(undefined);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    __setAttractionSourceForTests((globalThis as any).__tbJestAttractionSource);
    jest.restoreAllMocks();
  });

  it('shareIdOf returns plan.shareId first', () => {
    expect(svc.shareIdOf(plan({ shareId: 'sh-1' }))).toBe('sh-1');
  });

  it('exportItinerary with 0 Token: a 402 opens the insufficient modal, no download, no spend', async () => {
    jest.spyOn(api, 'exportItinerary').mockReturnValue(throwError(() => ({ status: 402 })));
    const handle = jest.spyOn(karmaModal, 'handleKarmaError');
    const spend = jest.spyOn(karma, 'spend');

    await svc.exportItinerary(plan());

    expect(handle).toHaveBeenCalled();
    expect(spend).not.toHaveBeenCalled();
    expect(svc.exportingPlanId()).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('exportItinerary success downloads, spends once, marks exported, shows "Itinerario descargado"', async () => {
    const p = plan();
    savedPlans.register(p);
    jest.spyOn(api, 'exportItinerary').mockReturnValue(of(new Blob()));
    const spend = jest.spyOn(karma, 'spend');

    await svc.exportItinerary(p);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(spend).toHaveBeenCalledTimes(1);
    expect(savedPlans.plans().find(x => x.id === 'p1')?.exportedAt).toBeTruthy();
    expect(toast.message()).toBe('Itinerario descargado');
  });

  it('unpublish success clears the shareId and emits true', async () => {
    const p = plan({ shareId: 'sh-1' });
    savedPlans.register(p);
    jest.spyOn(api, 'unshareTrip').mockReturnValue(of(undefined));

    const result = await new Promise<boolean>(resolve => svc.unpublish(p).subscribe(resolve));

    expect(result).toBe(true);
    expect(savedPlans.plans().find(x => x.id === 'p1')?.shareId).toBeUndefined();
    expect(svc.unpublishingPlanId()).toBeNull();
  });

  it('unpublish error emits false and toasts "No se pudo despublicar el viaje"', async () => {
    const p = plan({ shareId: 'sh-1' });
    savedPlans.register(p);
    jest.spyOn(api, 'unshareTrip').mockReturnValue(throwError(() => ({ status: 500 })));

    const result = await new Promise<boolean>(resolve => svc.unpublish(p).subscribe(resolve));

    expect(result).toBe(false);
    expect(toast.message()).toBe('No se pudo despublicar el viaje');
    expect(savedPlans.plans().find(x => x.id === 'p1')?.shareId).toBe('sh-1');
  });
});
