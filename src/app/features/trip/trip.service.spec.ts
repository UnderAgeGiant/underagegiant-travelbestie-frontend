import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TripService } from './trip.service';
import { City } from '../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };
const TOKYO: City = { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'asia' };

describe('TripService', () => {
  let service: TripService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
  });

  it('starts with no stops', () => {
    expect(service.stops()).toEqual([]);
  });

  it('addStop appends a stop and sets it active by stopId', () => {
    service.addStop(PARIS, '2026-06-01', '2026-06-05');
    expect(service.stops()).toHaveLength(1);
    expect(service.stops()[0].cityId).toBe('paris');
    const stopId = service.stops()[0].stopId;
    expect(stopId).toBeTruthy();
    expect(service.activeId()).toBe(stopId);
  });

  it('removeStop removes by stopId and activates next', () => {
    service.addStop(PARIS, '', '');
    service.addStop(TOKYO, '', '');
    const parisStopId = service.stops().find(s => s.cityId === 'paris')!.stopId;
    service.removeStop(parisStopId);
    expect(service.stops()).toHaveLength(1);
    expect(service.stops()[0].cityId).toBe('tokyo');
  });

  it('removeStop sets activeId to null when last stop removed', () => {
    service.addStop(PARIS, '', '');
    const parisStopId = service.stops()[0].stopId;
    service.removeStop(parisStopId);
    expect(service.stops()).toHaveLength(0);
    expect(service.activeId()).toBeNull();
  });

  it('existingCityIds returns array of cityIds', () => {
    service.addStop(PARIS, '', '');
    expect(service.existingCityIds()).toContain('paris');
  });

  it('allows same city to appear twice with independent attractions', () => {
    service.addStop(PARIS, '2026-06-01', '2026-06-05');
    service.addStop(PARIS, '2026-07-01', '2026-07-05');
    expect(service.stops()).toHaveLength(2);
    const [stop1, stop2] = service.stops();
    expect(stop1.stopId).not.toBe(stop2.stopId);
    service.addAttraction(stop1.stopId, 'paris_0', '10:00');
    expect(service.selectedAttractionsFor(stop1.stopId)).toHaveLength(1);
    expect(service.selectedAttractionsFor(stop2.stopId)).toHaveLength(0);
  });
});
