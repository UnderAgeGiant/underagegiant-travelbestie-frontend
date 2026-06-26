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
