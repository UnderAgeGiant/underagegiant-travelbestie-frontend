import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightTourService } from './highlight-tour.service';
import { HighlightRegistryService } from './highlight-registry.service';
import { HighlightSeenService } from './highlight-seen.service';

type MediaListener = (e: { matches: boolean }) => void;

// Same helper as device.service.spec.ts — HighlightTourService now injects DeviceService
// (for the mobile scroll-into-view behavior below), so every test in this file needs
// window.matchMedia stubbed before that first injection or DeviceService's constructor throws.
function installMatchMediaMock(initialMatches: boolean) {
  let listener: MediaListener | null = null;
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: (_: string, cb: MediaListener) => { listener = cb; },
    removeEventListener: () => { listener = null; },
  };
  (window as any).matchMedia = () => mql;
  return { fire(matches: boolean) { mql.matches = matches; listener?.({ matches }); } };
}

describe('HighlightTourService', () => {
  let service: HighlightTourService;
  let registry: HighlightRegistryService;
  let seen: HighlightSeenService;
  let http: HttpTestingController;
  let media: ReturnType<typeof installMatchMediaMock>;

  function registerAllLandingTargets(): void {
    // jsdom doesn't implement scrollIntoView on a plain element — stub it so any test that
    // flips media.fire(true) doesn't crash on a target it isn't specifically asserting on.
    const logo = document.createElement('div');
    const login = document.createElement('div');
    const aiPlan = document.createElement('div');
    logo.scrollIntoView = () => {};
    login.scrollIntoView = () => {};
    aiPlan.scrollIntoView = () => {};
    registry.register('nav-logo', logo);
    registry.register('login-btn', login);
    registry.register('ai-plan-btn', aiPlan);
  }

  beforeEach(() => {
    sessionStorage.clear();
    media = installMatchMediaMock(false); // desktop by default — individual tests opt into mobile via media.fire(true)
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
      ],
    });
    service  = TestBed.inject(HighlightTourService);
    registry = TestBed.inject(HighlightRegistryService);
    seen     = TestBed.inject(HighlightSeenService);
    http     = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('start() does nothing (no request) when the session cache already marks it seen', () => {
    seen.markSeenLocally('landing_welcome');
    service.start('landing_welcome');
    http.expectNone(r => r.url.includes('/highlights/'));
    expect(service.activeType()).toBeNull();
  });

  it('start() checks the server, and opens the tour at step 0 when not seen', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });

    expect(service.activeType()).toBe('landing_welcome');
    expect(service.stepIndex()).toBe(0);
    expect(service.currentStep()?.targetId).toBe('nav-logo');
  });

  it('start() does not open the tour when the server says already seen, and caches that answer locally', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: true });

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
  });

  it('next() advances the step index', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.next();
    expect(service.stepIndex()).toBe(1);
    expect(service.currentStep()?.targetId).toBe('login-btn');
  });

  it('next() past the last step completes the tour (marks seen, closes)', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.next(); // now at step 1 (login-btn)
    service.next(); // past the end → complete()
    service.next(); // now at step 2 (ai-plan-btn)

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
    const postReq = http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen') && r.method === 'POST');
    postReq.flush(null);
  });

  it('close() dismisses the tour immediately regardless of step index, without marking it seen', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.close();

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(false);
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss') && r.method === 'POST').flush(null);
  });

  it('prev() at step 0 is a no-op', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.prev();
    expect(service.stepIndex()).toBe(0);
  });

  it('skips a step whose target never registers, without ever showing a hole-less veil for it', async () => {
    jest.useFakeTimers();
    // Only 'ai-plan-btn' exists — simulate an already-logged-in visitor, for whom the
    // nav never renders "Iniciar sesión" at all, so 'login-btn' never registers.
    registry.register('ai-plan-btn', document.createElement('div'));

    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    // resolveCurrentTarget() polls up to 10x at 100ms per missing target: 'nav-logo' and
    // 'login-btn' are each skipped in turn, landing on 'ai-plan-btn'.
    await jest.advanceTimersByTimeAsync(1100);
    await jest.advanceTimersByTimeAsync(1100);

    expect(service.activeType()).toBe('landing_welcome');
    expect(service.currentStep()?.targetId).toBe('ai-plan-btn');
    jest.useRealTimers();
  });

  it('skips the tour entirely when no target ever registers', async () => {
    jest.useFakeTimers();
    // Nothing registered at all — start() should end in complete() rather than
    // getting stuck, and mark the type seen so it doesn't retry every render.
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    await jest.advanceTimersByTimeAsync(1100); // exhausts step 0's polling, skips to step 1
    await jest.advanceTimersByTimeAsync(1100); // exhausts step 1's polling, skips to step 2
    await jest.advanceTimersByTimeAsync(1100); // exhausts step 2's polling, no more steps → complete()

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen')).flush(null);
    jest.useRealTimers();
  });

  it('start() with shouldStillShow: does not open the tour when the guard fails, and never marks it seen', () => {
    registerAllLandingTargets();
    service.start('landing_welcome', { shouldStillShow: () => false });
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(false); // never marked seen — it just never got a chance to show
    http.verify(); // no POST /seen either — nothing was ever actually shown
  });

  it('start() with shouldStillShow: opens the tour normally when the guard passes', () => {
    registerAllLandingTargets();
    service.start('landing_welcome', { shouldStillShow: () => true });
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });

    expect(service.activeType()).toBe('landing_welcome');
  });

  it('scrolls the step target into view on mobile at the start of the tour', () => {
    media.fire(true);
    registerAllLandingTargets();
    const logoEl = registry.get('nav-logo')!;
    const scrollSpy = jest.fn();
    logoEl.scrollIntoView = scrollSpy;

    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('scrolls the new step target into view again on mobile when advancing with next()', () => {
    media.fire(true);
    registerAllLandingTargets();
    const loginEl = registry.get('login-btn')!;
    const scrollSpy = jest.fn();
    loginEl.scrollIntoView = scrollSpy;

    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });
    service.next();

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('does not scroll the step target into view on desktop', () => {
    registerAllLandingTargets();
    const logoEl = registry.get('nav-logo')!;
    const scrollSpy = jest.fn();
    logoEl.scrollIntoView = scrollSpy;

    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
