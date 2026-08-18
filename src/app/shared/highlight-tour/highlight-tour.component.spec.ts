import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HighlightTourComponent } from './highlight-tour.component';
import { HighlightTourService } from './highlight-tour.service';
import { HighlightRegistryService } from './highlight-registry.service';

describe('HighlightTourComponent', () => {
  let http: HttpTestingController;
  let tour: HighlightTourService;
  let registry: HighlightRegistryService;

  beforeEach(() => {
    sessionStorage.clear();
    // HighlightTourService injects DeviceService (mobile scroll-into-view behavior) — stub
    // matchMedia so its constructor doesn't throw when TestBed.inject(HighlightTourService) runs below.
    (window as any).matchMedia = (window as any).matchMedia ?? (() => ({
      matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
    }));
    TestBed.configureTestingModule({
      imports: [HighlightTourComponent],
      providers: [
        provideHttpClient(withXhr()), provideHttpClientTesting(),
        { provide: 'ENV', useValue: { useMocks: false, apiUrl: 'http://localhost:3000' } },
        { provide: LOCALE_ID, useValue: 'es-CL' },
      ],
    });
    http     = TestBed.inject(HttpTestingController);
    tour     = TestBed.inject(HighlightTourService);
    registry = TestBed.inject(HighlightRegistryService);
  });

  afterEach(() => {
    http.verify();
    document.querySelectorAll('.tour-blocker, .tour-spotlight-ring, .tour-scene').forEach(el => el.remove());
  });

  it('renders nothing when no tour is active', () => {
    const fixture = TestBed.createComponent(HighlightTourComponent);
    fixture.detectChanges();
    expect(document.body.querySelector('.tour-scene')).toBeNull();
  });

  it('renders the bubble text for the current step once a tour starts', () => {
    registry.register('login-btn', document.createElement('div'));
    const fixture = TestBed.createComponent(HighlightTourComponent);
    fixture.detectChanges();

    tour.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });
    fixture.detectChanges();

    const text = document.body.querySelector('.tour-bubble-text')?.textContent ?? '';
    expect(text).toContain('Bienvenido a Tripilove');
  });

  it('the close button calls tour.close()', () => {
    registry.register('login-btn', document.createElement('div'));
    const fixture = TestBed.createComponent(HighlightTourComponent);
    fixture.detectChanges();
    tour.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });
    fixture.detectChanges();

    const closeSpy = jest.spyOn(tour, 'close');
    (document.body.querySelector('.tour-close') as HTMLButtonElement).click();
    expect(closeSpy).toHaveBeenCalled();

    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss')).flush(null);
  });

  it('cycles the dog image through all 3 frames in order, then loops back to the first', () => {
    jest.useFakeTimers();
    registry.register('login-btn', document.createElement('div'));
    const fixture = TestBed.createComponent(HighlightTourComponent);
    fixture.detectChanges();
    tour.start('landing_welcome');
    http.expectOne(r => r.url.includes('/status')).flush({ seen: false });
    fixture.detectChanges();

    const img = () => (document.body.querySelector('.tour-dog') as HTMLImageElement).src;
    expect(img()).toContain('Dog-highlight-wagging-tail-1.png');

    jest.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(img()).toContain('Dog-highlight-wagging-tail-2.png');

    jest.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(img()).toContain('Dog-highlight-playfull-1.png');

    jest.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(img()).toContain('Dog-highlight-wagging-tail-1.png'); // loops back to frame 1

    jest.useRealTimers();
  });

  it('stops the frame-loop interval on destroy (no leaked timer)', () => {
    jest.useFakeTimers();
    registry.register('login-btn', document.createElement('div'));
    const fixture = TestBed.createComponent(HighlightTourComponent);
    fixture.detectChanges();
    const clearSpy = jest.spyOn(global, 'clearInterval');

    fixture.destroy();

    expect(clearSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
