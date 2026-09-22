import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
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

  it('scrollToFeed() scrolls the S6 feed section into view', () => {
    const fixture = setup(0);
    const host = fixture.nativeElement.querySelector('tb-landing-feed') as HTMLElement;
    expect(host).not.toBeNull();
    host.scrollIntoView = jest.fn();
    fixture.componentInstance.scrollToFeed();
    expect(host.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('places the feed after the full About section (S6)', () => {
    const fixture = setup(0);
    const scroll = fixture.nativeElement.querySelector('.landing-scroll') as HTMLElement;
    const last = scroll.lastElementChild as HTMLElement;
    expect(last.tagName.toLowerCase()).toBe('tb-landing-feed');
  });

  it('does not render the scroll hint (dead control removed, feedback #1)', () => {
    const el = setup(0).nativeElement as HTMLElement;
    expect(el.querySelector('.scroll-hint')).toBeNull();
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

  // S5's closing CTA (About Us content appended to the landing scroll, feedback #4) should
  // scroll back to the top of the page — the routed /about page's own CTA still navigates
  // home via goHome(), untouched; only the landing-section wiring changes here.
  it('scrollToTop scrolls the S1 section into view in landing mode', () => {
    const fixture = setup(0);
    const el = fixture.nativeElement.querySelector('.s1-shell') as HTMLElement;
    const scrollSpy = jest.fn();
    el.scrollIntoView = scrollSpy;

    fixture.componentInstance.scrollToTop();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrollToTop is a no-op in app mode (no landing scroll section to scroll)', () => {
    const fixture = setup(2);
    expect(() => fixture.componentInstance.scrollToTop()).not.toThrow();
  });

  it('wires the S5 About Us closing CTA to scrollToTop, not showAddModal', () => {
    const fixture = setup(0);
    const component = fixture.componentInstance;
    const scrollSpy = jest.spyOn(component, 'scrollToTop').mockImplementation(() => {});

    const aboutContent = fixture.debugElement.query((de) => de.name === 'app-about-content');
    aboutContent.triggerEventHandler('startPlanning', undefined);

    expect(scrollSpy).toHaveBeenCalled();
    expect(component.showAddModal()).toBe(false);
  });

  it('closes showProfile/showAiPlanning and opens showMyTrips when pendingMyTripsTab is set', () => {
    const fixture = setup(0);
    const component = fixture.componentInstance;
    component.showAiPlanning.set(true);
    fixture.detectChanges();

    (component as any).facade.pendingMyTripsTab.set('trips');
    fixture.detectChanges();

    expect(component.showAiPlanning()).toBe(false);
    expect(component.showMyTrips()).toBe(true);
  });

  it('closes showProfile/showMyTrips/showAiPlanning when the facade requests the overlays close (e.g. loading a saved plan from the nav dropdown while a page overlay is open)', () => {
    const fixture = setup(0);
    const component = fixture.componentInstance;
    component.showProfile.set(true);
    fixture.detectChanges();

    (component as any).facade.closeOverlaysRequestId.update((v: number) => v + 1);
    fixture.detectChanges();

    expect(component.showProfile()).toBe(false);
    expect(component.showMyTrips()).toBe(false);
    expect(component.showAiPlanning()).toBe(false);
  });

  // Feedback #4 — scrolling the homepage all the way down should end with the full
  // About Us content (AboutContentComponent, extracted in Task 7), not stop at the S4 footer.
  it('renders the full About Us content as a landing section, after the footer (feedback #4)', () => {
    const el = setup(0).nativeElement as HTMLElement;
    const sections = el.querySelectorAll('.landing-scroll > *');
    // S1, S2, S4, S5 plus the S6 infinite feed host (<tb-landing-feed>) appended after About.
    // (S3, tb-landing-about, was pulled out of the landing scroll 2026-09-22 — component kept, just unmounted.)
    expect(sections.length).toBe(5);
    expect(el.querySelector('tb-app-footer + .landing-about-full, tb-app-footer ~ .landing-about-full')).not.toBeNull();
    expect(el.querySelector('.landing-about-full app-about-content')).not.toBeNull();
  });

  // Task 10 — "Planificar mi viaje a <ciudad>" from a city guide page navigates here with ?addCity=<cityId>.
  describe('?addCity= planner pre-fill (from a city guide page)', () => {
    function setupWithQueryParam(addCity: string | null) {
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
        providers: [
          provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(addCity ? { addCity } : {}) } } },
        ],
      });
      const fixture = TestBed.createComponent(ShellComponent);
      fixture.detectChanges();
      return fixture;
    }

    it('opens the add-stop modal pre-filled when the id is a known city', () => {
      const component = setupWithQueryParam('madrid').componentInstance;
      expect(component.showAddModal()).toBe(true);
      expect(component.presetCityId()).toBe('madrid');
    });

    it('does nothing for an unknown city id', () => {
      const component = setupWithQueryParam('atlantis').componentInstance;
      expect(component.showAddModal()).toBe(false);
      expect(component.presetCityId()).toBeNull();
    });

    it('does nothing when the param is absent', () => {
      const component = setupWithQueryParam(null).componentInstance;
      expect(component.showAddModal()).toBe(false);
      expect(component.presetCityId()).toBeNull();
    });
  });
});
