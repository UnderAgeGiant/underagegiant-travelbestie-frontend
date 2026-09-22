import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { SharedTripComponent } from './shared-trip.component';
import { SeoService } from '../../core/seo/seo.service';
import { sharedPendingSeo } from '../../core/seo/seo-pages';

// SharedTripComponent renders <app-nav>, whose DeviceService reads window.matchMedia.
(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

/**
 * Regression coverage for the "selecting a second shared trip from the nav drawer doesn't
 * change the page" bug: Angular's default route-reuse strategy keeps the same
 * SharedTripComponent instance alive across a /shared/:id -> /shared/:id2 navigation (only the
 * route param changes). `tripId` used to be a computed() reading `route.snapshot.paramMap`
 * directly — a plain, non-reactive property read — so it only ever evaluated once and never
 * picked up the new id. These tests drive `ActivatedRoute.paramMap` (an Observable, which the
 * fix now subscribes to via toSignal) directly, without a full Router/route-config harness,
 * since the bug and the fix both live entirely in how this component reads its own route.
 */
describe('SharedTripComponent — route param reactivity', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'trip-a' }));

    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$,
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the trip named by the initial route param', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.tripId()).toBe('trip-a');
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Roma', ownerName: 'Ana', stops: [], transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
  });

  it('re-fetches a different trip when the route id param changes (bug: page never updated on a second selection)', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Roma', ownerName: 'Ana', stops: [], transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});

    paramMap$.next(convertToParamMap({ id: 'trip-b' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.tripId()).toBe('trip-b');
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-b')).flush({
      tripName: 'Venecia', ownerName: 'Ana', stops: [], transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-b/comments')).flush({});
  });
});

describe('SharedTripComponent — city info + weather on itin-city-head', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the city weather chip and info badge for each stop', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Viaje a París', ownerName: 'Ana',
      stops: [{ cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] }],
      transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    fixture.detectChanges();

    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-city-weather-chip')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-city-info-badge')).toBeTruthy();
  });
});

describe('SharedTripComponent — day-boundary divider between itin-items (feedback round 2, item 4)', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushTrip(selectedAttractions: any[]): void {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Viaje a París', ownerName: 'Ana',
      stops: [{ cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions }],
      transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    fixture.detectChanges();
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
    fixture.detectChanges();
  }

  it('renders one divider between two attractions on different days', () => {
    flushTrip([
      { attractionId: 'paris_0', date: '02/06/2026', startTime: '09:00' },
      { attractionId: 'paris_1', date: '03/06/2026', startTime: '10:00' },
    ]);

    expect(fixture.nativeElement.querySelectorAll('.itin-day-divider').length).toBe(1);
  });

  it('renders no divider when every attraction falls on the same day', () => {
    flushTrip([
      { attractionId: 'paris_0', date: '02/06/2026', startTime: '09:00' },
      { attractionId: 'paris_1', date: '02/06/2026', startTime: '14:00' },
    ]);

    expect(fixture.nativeElement.querySelectorAll('.itin-day-divider').length).toBe(0);
  });

  it('displays out-of-storage-order attractions sorted by date, with the divider in the right place', () => {
    // Stored day-2 first, day-1 second — display should still read day 1 then day 2.
    flushTrip([
      { attractionId: 'paris_1', date: '03/06/2026', startTime: '10:00' },
      { attractionId: 'paris_0', date: '02/06/2026', startTime: '09:00' },
    ]);

    const dividers = fixture.nativeElement.querySelectorAll('.itin-day-divider');
    expect(dividers.length).toBe(1);
    // The divider must sit strictly between the two .itin-item rows, not before both or after both.
    const items = fixture.nativeElement.querySelectorAll('.itin-item');
    expect(items.length).toBe(2);
    const firstItemIndex = Array.from(items[0].parentElement!.children).indexOf(items[0]);
    const dividerIndex = Array.from(items[0].parentElement!.children).indexOf(dividers[0]);
    const secondItemIndex = Array.from(items[0].parentElement!.children).indexOf(items[1]);
    expect(dividerIndex).toBeGreaterThan(firstItemIndex);
    expect(dividerIndex).toBeLessThan(secondItemIndex);
  });
});

describe('SharedTripComponent — duplicate attractionId on different days (NG0955 regression)', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders the same attraction twice on different days without throwing NG0955', () => {
    // Bug fix: track by $index instead of attractionId, so the same attraction ID
    // appearing twice (e.g., breakfast and dinner at the same restaurant) doesn't
    // trigger "NG0955: Duplicate key in @for loop".
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Viaje a París', ownerName: 'Ana',
      stops: [{
        cityId: 'paris',
        checkIn: '01/06/2026',
        checkOut: '05/06/2026',
        selectedAttractions: [
          { attractionId: 'paris_5', date: '02/06/2026', startTime: '09:00' },
          { attractionId: 'paris_5', date: '02/06/2026', startTime: '19:00' }, // Same attraction, different time
        ]
      }],
      transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    fixture.detectChanges();
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
    fixture.detectChanges();

    // If NG0955 were thrown, the component would fail to render. Verifying that there are
    // exactly 2 .itin-item rows confirms that both entries rendered successfully.
    const items = fixture.nativeElement.querySelectorAll('.itin-item');
    expect(items.length).toBe(2);
  });
});

describe('SharedTripComponent — trip map', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function loadTwoStopTrip() {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Viaje a Europa', ownerName: 'Ana',
      stops: [
        { stopId: 'stop-paris', cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] },
        { stopId: 'stop-london', cityId: 'london', checkIn: '05/06/2026', checkOut: '09/06/2026', selectedAttractions: [] },
      ],
      transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    fixture.detectChanges();
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
    fixture.detectChanges();
  }

  it('shows a "Ver mapa" button that opens the trip map', () => {
    loadTwoStopTrip();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.shared-trip-map-btn');
    expect(btn).not.toBeNull();

    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-trip-map')).not.toBeNull();
  });

  it('a pin click selects that stop, closes the modal, and scrolls to its city card', () => {
    loadTwoStopTrip();
    fixture.componentInstance.tripMapOpen.set(true);
    fixture.detectChanges();

    fixture.componentInstance.onTripMapPinClick('stop-london');
    fixture.detectChanges();
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedShareStop()?.stopId).toBe('stop-london');
    expect(fixture.componentInstance.tripMapOpen()).toBe(false);
  });
});

describe('SharedTripComponent — SEO metadata', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;
  const seo = { apply: jest.fn(), reset: jest.fn() };

  beforeEach(() => {
    seo.apply.mockClear();
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SeoService, useValue: seo },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('applies shared-trip SEO with the /shared/<id> canonical path after a successful fetch', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush({
      tripName: 'Viaje a París', ownerName: 'Ana',
      stops: [{ cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] }],
      transits: [],
    });
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});

    expect(seo.apply).toHaveBeenCalledTimes(1);
    expect(seo.apply.mock.calls[0][0].path).toBe('/shared/trip-a');
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
  });

  it('applies noindex SEO when the shared trip is not found (404)', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a'))
      .flush({ error: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(seo.apply).toHaveBeenCalledTimes(1);
    expect(seo.apply.mock.calls[0][0].noindex).toBe(true);
  });
});

describe('SharedTripComponent — stale response must not clobber SEO', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const seo = { apply: jest.fn(), reset: jest.fn() };
  const body = (name: string) => ({
    tripName: name, ownerName: 'Ana',
    stops: [{ cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] }],
    transits: [],
  });
  // match() removes requests from the open list, so tests hold on to the TestRequests. A cancelled (unsubscribed) request is what a
  // well-behaved component leaves behind; the old code left it live, so a late response still reached SeoService.
  const grab = (urlEnd: string) => httpMock.match(req => req.url.endsWith(urlEnd));
  const flushIfLive = (reqs: TestRequest[], payload: unknown) => reqs.forEach(r => { if (!r.cancelled) r.flush(payload as object); });

  beforeEach(() => {
    seo.apply.mockClear();
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'trip-a' }));
    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SeoService, useValue: seo },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$, snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) } } },
      ],
    });
    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('does not apply SEO when the component is destroyed before the response lands', () => {
    fixture.detectChanges();
    const trip = grab('/shared/trip-a');
    const comments = grab('/shared/trip-a/comments');
    expect(trip).toHaveLength(1);
    fixture.destroy();

    flushIfLive(trip, body('Viaje A'));
    flushIfLive(comments, {});

    expect(seo.apply).not.toHaveBeenCalled();
  });

  it('last request wins: a slow response for the previous trip is dropped after the id changes', () => {
    fixture.detectChanges();
    const tripA = grab('/shared/trip-a');
    const commentsA = grab('/shared/trip-a/comments');
    expect(tripA).toHaveLength(1);

    paramMap$.next(convertToParamMap({ id: 'trip-b' }));
    fixture.detectChanges();

    // trip-b answers first, then the stale trip-a response arrives late
    flushIfLive(grab('/shared/trip-b'), body('Viaje B'));
    flushIfLive(grab('/shared/trip-b/comments'), {});
    flushIfLive(tripA, body('Viaje A'));
    flushIfLive(commentsA, {});

    expect(seo.apply).toHaveBeenCalledTimes(1);
    expect(seo.apply.mock.calls[0][0].path).toBe('/shared/trip-b');
    flushIfLive(httpMock.match(req => req.url.includes('/weather')), { days: [] });
  });
});

/**
 * Regression coverage for the 2026-09-21 "noindex tag detected" incident (live-verified in a real browser via
 * chrome-devtools MCP): SeoRouteListener applies /shared/:id's route-data sharedPendingSeo() on NavigationEnd —
 * before SharedTripComponent's fetchTrip() resolves. When sharedPendingSeo() carried `noindex: true`, a
 * JS-rendering crawler could snapshot <meta name="robots" content="noindex,follow"> during that window on a
 * plan that is fully indexable once loaded. Uses the REAL SeoService (not the jest.fn() mock the other
 * describe blocks above use) so document.head reflects what a crawler's renderer would actually see.
 */
describe('SharedTripComponent — no false noindex while the shared plan is loading', () => {
  let fixture: ComponentFixture<SharedTripComponent>;
  let httpMock: HttpTestingController;
  let seo: SeoService;
  const robotsMeta = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;

  const indexableTrip = {
    tripName: 'Viaje a Europa', ownerName: 'Ana',
    stops: [{
      cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026',
      selectedAttractions: [
        { attractionId: 'paris_0' }, { attractionId: 'paris_1' }, { attractionId: 'paris_2' },
      ],
    }],
    transits: [],
  };

  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default description">';
    document.title = 'Default title';

    TestBed.configureTestingModule({
      imports: [SharedTripComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'trip-a' })),
            snapshot: { paramMap: convertToParamMap({ id: 'trip-a' }) },
          },
        },
      ],
    });

    seo = TestBed.inject(SeoService);
    // Mirrors what SeoRouteListener does at navigation time, before the lazy-loaded component is constructed.
    seo.apply(sharedPendingSeo());

    fixture = TestBed.createComponent(SharedTripComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('has NO robots meta while the fetch is still pending', () => {
    fixture.detectChanges();
    expect(robotsMeta()).toBeNull();

    // Drain the in-flight requests so httpMock.verify() in afterEach doesn't fail.
    httpMock.match(() => true).forEach(r => r.flush(indexableTrip));
    fixture.detectChanges();
    httpMock.match(() => true).forEach(r => r.flush({ days: [] }));
  });

  it('resolves to no robots meta once an indexable plan loads', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a')).flush(indexableTrip);
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});

    expect(robotsMeta()).toBeNull();
    httpMock.match(req => req.url.includes('/weather')).forEach(r => r.flush({ days: [] }));
  });

  it('resolves to robots noindex,follow when the plan is not found (unchanged, still correct)', () => {
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a/comments')).flush({});
    httpMock.expectOne(req => req.url.endsWith('/shared/trip-a'))
      .flush({ error: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(robotsMeta()).toBe('noindex,follow');
  });
});
