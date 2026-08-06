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

  it('setTicketPurchased toggles the flag on the matching entry only', () => {
    service.addStop(PARIS, '2026-06-01', '2026-06-05');
    const stopId = service.stops()[0].stopId;
    service.addAttraction(stopId, 'paris_0', '10:00');
    service.addAttraction(stopId, 'paris_1', '12:00');
    const [entryA, entryB] = service.stops()[0].selectedAttractions;

    service.setTicketPurchased(stopId, entryA.entryId, true);

    const [updatedA, updatedB] = service.stops()[0].selectedAttractions;
    expect(updatedA.ticketPurchased).toBe(true);
    expect(updatedB.ticketPurchased).toBeUndefined();
  });
});

describe('TripService.loadForUserPreservingAnonymous', () => {
  let service: TripService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
  });

  it('does NOT restore localStorage plan on login — editor stays empty', () => {
    localStorage.setItem('tb_plan_user@test.com', JSON.stringify({
      stops: [{ stopId: 's1', cityId: 'paris', cityName: 'Paris', country: 'France',
                flag: '🇫🇷', region: 'europe', checkIn: '', checkOut: '',
                selectedAttractions: [], lodging: null }],
      transits: [],
    }));
    expect(service.stops()).toHaveLength(0);

    service.loadForUserPreservingAnonymous('user@test.com');

    expect(service.stops()).toHaveLength(0);
  });

  it('preserves anonymous stops built before login', () => {
    service.addStop(PARIS, '2026-08-01', '2026-08-05');
    expect(service.stops()).toHaveLength(1);

    service.loadForUserPreservingAnonymous('user@test.com');

    expect(service.stops()).toHaveLength(1);
    expect(service.stops()[0].cityId).toBe('paris');
  });

  it('clears loadedPlanId on login', () => {
    service.markAsLoadedPlan('some-plan-id');
    expect(service.loadedPlanId()).toBe('some-plan-id');

    service.loadForUserPreservingAnonymous('user@test.com');

    expect(service.loadedPlanId()).toBeNull();
  });
});
