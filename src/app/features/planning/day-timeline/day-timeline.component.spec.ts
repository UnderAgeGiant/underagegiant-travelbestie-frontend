import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DayTimelineComponent } from './day-timeline.component';
import { TripService } from '../../trip/trip.service';
import { City } from '../../../core/models/city.model';

const PARIS: City  = { id: 'paris',  name: 'Paris',  country: 'France', flag: '🇫🇷', region: 'europe' };
const LONDON: City = { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe' };

describe('DayTimelineComponent — mobile collapse default', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    localStorage.clear();
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
    jest.spyOn(component as any, 'isMobileViewport').mockReturnValue(true);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    expect(component['collapsed']()).toBe(true);
  });

  it('does not collapse when a stop is selected on desktop', () => {
    jest.spyOn(component as any, 'isMobileViewport').mockReturnValue(false);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    expect(component['collapsed']()).toBe(false);
  });

  it('does not re-collapse on edits to the same stop', () => {
    jest.spyOn(component as any, 'isMobileViewport').mockReturnValue(true);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    component['collapsed'].set(false);

    trip.updateDates(trip.activeStop()!.stopId, '02/06/2026', '06/06/2026');
    fixture.detectChanges();

    expect(component['collapsed']()).toBe(false);
  });

  it('re-collapses when switching to a different stop', () => {
    jest.spyOn(component as any, 'isMobileViewport').mockReturnValue(true);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    component['collapsed'].set(false);

    trip.addStop(LONDON, '06/06/2026', '10/06/2026');
    fixture.detectChanges();

    expect(component['collapsed']()).toBe(true);
  });
});
