import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DayTimelineComponent } from './day-timeline.component';
import { TripService } from '../../trip/trip.service';
import { City } from '../../../core/models/city.model';

const PARIS: City  = { id: 'paris',  name: 'Paris',  country: 'France', flag: '🇫🇷', region: 'europe' };
const LONDON: City = { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe' };

type MqlListener = (e: { matches: boolean }) => void;

function installMatchMediaMock(initialMatches: boolean) {
  let listener: MqlListener | null = null;
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: (_: string, cb: MqlListener) => { listener = cb; },
    removeEventListener: () => { listener = null; },
  };
  (window as any).matchMedia = () => mql;
  return {
    fire(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches });
    },
  };
}

describe('DayTimelineComponent — mobile collapse default', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // default: desktop
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('collapses by default when a stop is selected on mobile', () => {
    installMatchMediaMock(true);
    // Recreate with mobile media query
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    expect(mobileFixture.componentInstance['collapsed']()).toBe(true);
  });

  it('does not collapse when a stop is selected on desktop', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    expect(component['collapsed']()).toBe(false);
  });

  it('does not re-collapse on edits to the same stop', () => {
    installMatchMediaMock(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    mobileFixture.componentInstance['collapsed'].set(false);

    mobileTrip.updateDates(mobileTrip.activeStop()!.stopId, '02/06/2026', '06/06/2026');
    mobileFixture.detectChanges();

    expect(mobileFixture.componentInstance['collapsed']()).toBe(false);
  });

  it('re-collapses when switching to a different stop', () => {
    installMatchMediaMock(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    mobileFixture.componentInstance['collapsed'].set(false);

    mobileTrip.addStop(LONDON, '06/06/2026', '10/06/2026');
    mobileFixture.detectChanges();

    expect(mobileFixture.componentInstance['collapsed']()).toBe(true);
  });
});

describe('DayTimelineComponent — trip-wide days', () => {
  it('builds day tabs spanning every stop in the trip', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const trip = TestBed.inject(TripService);
    trip.restoreStops([
      { stopId: 's1', cityId: 'paris',  checkIn: '01/06/2026', checkOut: '02/06/2026', selectedAttractions: [] },
      { stopId: 's2', cityId: 'london', checkIn: '04/06/2026', checkOut: '05/06/2026', selectedAttractions: [] },
    ] as any, null, []);

    const comp = TestBed.createComponent(DayTimelineComponent).componentInstance;
    const days = (comp as any).days() as Array<{ key: string; cityId: string }>;
    const keys = days.map(d => d.key);
    expect(keys).toEqual(expect.arrayContaining(['01/06', '02/06', '04/06', '05/06']));
    expect(days.some(d => d.cityId === 'paris')).toBe(true);
    expect(days.some(d => d.cityId === 'london')).toBe(true);
  });
});

describe('DayTimelineComponent — routeUrl arrival/departure terminals', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
  });

  it('uses the arrival transit terminal (not lodging) as origin on the stop\'s first day', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'flight', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('01/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Aeropuerto');
    expect(url).not.toContain('origin=Hotel');
  });

  it('uses the departure transit terminal (not lodging) as destination on the stop\'s last day', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '03/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: 'paris', toCityId: '__end__',
      segments: [{ mode: 'train', departureDate: '03/06/2026', departureTime: '18:00', arrivalDate: '03/06/2026', arrivalTime: '20:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('03/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain(encodeURIComponent('Estación de tren'));
    expect(url).not.toContain('destination=Hotel');
  });

  it('falls back to lodging on days that are neither arrival nor departure', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '02/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'flight', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('02/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Hotel');
    expect(url).toContain('destination=Hotel');
  });

  it('falls back to lodging for bus/car arrivals (no fixed terminal)', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'bus', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('01/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Hotel');
  });
});

describe('DayTimelineComponent — hour grid range', () => {
  it('renders the full day from 00:00 to 23:00', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const comp = TestBed.createComponent(DayTimelineComponent).componentInstance;
    const hours = (comp as any).hours as number[];
    expect(hours[0]).toBe(0);                       // first hour line is 00:00
    expect(hours[hours.length - 1]).toBe(23);       // last hour line is 23:00
    expect(hours).toHaveLength(24);
    expect((comp as any).gridHeight()).toBe(23 * 46 + 12); // (TL_H1 − TL_H0) · TL_RH + 12
  });

  it('positions an early-morning attraction at its true offset from midnight', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '02/06/2026',
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '05:00', endTime: '06:00', date: '01/06/2026' },
      ],
    }] as any, null, []);
    const fixture = TestBed.createComponent(DayTimelineComponent);
    fixture.detectChanges();
    (fixture.componentInstance as any).selectedDay.set('01/06');
    const blocks = (fixture.componentInstance as any).blocks() as Array<{ top: number }>;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].top).toBe(5 * 46);  // 05:00 = 5 hours after the 00:00 grid origin
  });
});
