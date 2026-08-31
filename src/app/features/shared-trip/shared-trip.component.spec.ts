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
