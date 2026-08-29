import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { TripService } from '../trip/trip.service';
import { HighlightTourService } from '../../shared/highlight-tour/highlight-tour.service';

describe('ShellComponent', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  function setup(stopsLen: number) {
    (window as any).matchMedia = (window as any).matchMedia ?? (() => ({
      matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
    }));
    (global as any).IntersectionObserver = (global as any).IntersectionObserver ?? class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ShellComponent);
    if (stopsLen > 0) {
      const trip = TestBed.inject(TripService);
      trip.restoreStops(
        Array.from({ length: stopsLen }, (_, i) => ({
          stopId: `stop-${i}`, cityId: 'paris', checkIn: '01/07/2026', checkOut: '05/07/2026', selectedAttractions: [],
        })),
        null,
        [],
      );
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renders the landing scroll container when there are no stops', () => {
    const el = setup(0).nativeElement as HTMLElement;
    expect(el.querySelector('.landing-scroll')).toBeTruthy();
    expect(el.querySelector('.layout')).toBeFalsy();
  });

  it('renders the app layout when stops exist', () => {
    const el = setup(2).nativeElement as HTMLElement;
    expect(el.querySelector('.layout')).toBeTruthy();
    expect(el.querySelector('.landing-scroll')).toBeFalsy();
  });

  // Regression test — see docs/superpowers/plans/2026-08-16-highlights-module.md
  // ("Post-Implementation Changes" §6 follow-up). HighlightTourService.start() is called
  // directly from inside this component's own effect() (the landing_welcome trigger). Its
  // internal `_activeType()` guard read used to leak in as a dependency of THAT effect —
  // Angular attributes every signal read during an effect's synchronous execution to that
  // effect, regardless of which function performed the read. Dismissing the tour cleared
  // `_activeType`, which (having leaked in as a dependency) re-triggered this effect, which
  // called start() again — and since a dismissal never marks the tour "seen" locally (only
  // an explicit "¡Entendido!" does), the tour reopened immediately after being closed, with
  // no way to actually dismiss it. Fixed by wrapping HighlightTourService.start()'s body in
  // untracked().
  it('does not reopen the landing_welcome tour after it is dismissed via close()', () => {
    const fixture = setup(0);
    const http = TestBed.inject(HttpTestingController);
    const tour = TestBed.inject(HighlightTourService);

    http.expectOne(r => r.url.includes('/highlights/landing_welcome/status')).flush({ seen: false });
    fixture.detectChanges(); // flushes the effect's scheduled re-run after _activeType is set

    expect(tour.activeType()).toBe('landing_welcome');

    tour.close(); // same call the ✕ button/Escape make
    http.expectOne(r => r.url.includes('/highlights/landing_welcome/dismiss')).flush(null);
    fixture.detectChanges(); // would silently reopen the tour pre-fix

    expect(tour.activeType()).toBeNull();
  });

  // "Planes IA Pendientes" card click (MyTripsComponent's viewAiPlan output) → straight
  // to AiPlanningComponent's Step 3 with the slideshow running.
  it('openAiPlanResult stores the result and opens AI planning', () => {
    const fixture = setup(0);
    const component = fixture.componentInstance;
    const result = { title: 'Plan histórico', stops: [], transits: [] };

    component.openAiPlanResult(result);

    expect(component.pendingAiPlanResult()).toEqual(result);
    expect(component.showAiPlanning()).toBe(true);
  });

  it('closeAiPlanning clears pendingAiPlanResult so the next fresh open starts at Step 1', () => {
    const fixture = setup(0);
    const component = fixture.componentInstance;
    component.openAiPlanResult({ title: 'Plan histórico', stops: [], transits: [] });

    component.closeAiPlanning();

    expect(component.showAiPlanning()).toBe(false);
    expect(component.pendingAiPlanResult()).toBeNull();
  });

  // AiPlanningComponent's post-"Notificarme" hand-off ("Ok" button) → scroll the
  // landing page's S2 featured-plans section into view.
  it('scrollToFeatured scrolls the S2 featured section into view in landing mode', () => {
    const fixture = setup(0);
    const el = fixture.nativeElement.querySelector('tb-featured-slideshow') as HTMLElement;
    const scrollSpy = jest.fn();
    el.scrollIntoView = scrollSpy;

    fixture.componentInstance.scrollToFeatured();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrollToFeatured is a no-op in app mode (no landing scroll section to scroll)', () => {
    const fixture = setup(2);
    expect(() => fixture.componentInstance.scrollToFeatured()).not.toThrow();
  });
});
