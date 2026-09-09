import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedTripComponent } from './shared-trip.component';

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
