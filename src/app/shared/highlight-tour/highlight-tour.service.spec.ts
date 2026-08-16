import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightTourService } from './highlight-tour.service';
import { HighlightRegistryService } from './highlight-registry.service';
import { HighlightSeenService } from './highlight-seen.service';

describe('HighlightTourService', () => {
  let service: HighlightTourService;
  let registry: HighlightRegistryService;
  let seen: HighlightSeenService;
  let http: HttpTestingController;

  function registerAllLandingTargets(): void {
    registry.register('login-btn', document.createElement('div'));
    registry.register('ai-plan-btn', document.createElement('div'));
  }

  beforeEach(() => {
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name.startsWith('tb_highlight_seen_')) document.cookie = `${name}=; path=/; max-age=0`;
    });
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

  it('start() does nothing (no request) when the cookie already marks it seen', () => {
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
    expect(service.currentStep()?.targetId).toBe('login-btn');
  });

  it('start() does not open the tour when the server says already seen, and heals the local cookie', () => {
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
    expect(service.currentStep()?.targetId).toBe('ai-plan-btn');
  });

  it('next() past the last step completes the tour (marks seen, closes)', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.next(); // now at the last step (index 1)
    service.next(); // past the end → complete()

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
    const postReq = http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen') && r.method === 'POST');
    postReq.flush(null);
  });

  it('close() completes the tour immediately regardless of step index', () => {
    registerAllLandingTargets();
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    service.close();

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen')).flush(null);
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

    // resolveCurrentTarget() polls up to 10x at 100ms for 'login-btn', then skips to step 1.
    await jest.advanceTimersByTimeAsync(1100);

    expect(service.activeType()).toBe('landing_welcome');
    expect(service.currentStep()?.targetId).toBe('ai-plan-btn');
    jest.useRealTimers();
  });

  it('skips the tour entirely when neither target ever registers', async () => {
    jest.useFakeTimers();
    // Nothing registered at all — start() should end in complete() rather than
    // getting stuck, and mark the type seen so it doesn't retry every render.
    service.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });

    await jest.advanceTimersByTimeAsync(1100); // exhausts step 0's polling, skips to step 1
    await jest.advanceTimersByTimeAsync(1100); // exhausts step 1's polling, no more steps → complete()

    expect(service.activeType()).toBeNull();
    expect(seen.hasSeenLocally('landing_welcome')).toBe(true);
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/seen')).flush(null);
    jest.useRealTimers();
  });

  it('start() with shouldStillShow: does not open the tour when the guard fails, and touches no seen-state at all', () => {
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
});
