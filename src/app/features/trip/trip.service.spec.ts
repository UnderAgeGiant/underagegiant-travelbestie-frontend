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

  it('restoreStops auto-selects the first stop even when the incoming stops have no stopId (AI-generated plan)', () => {
    // AI-generated trips (POST /ai/plan response) never carry a stopId — it's a
    // frontend-only concept the AI is never told about. restoreStops must still
    // land on the first stop as active once migrateStop assigns it a fresh id.
    service.restoreStops([
      { cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] } as any,
      { cityId: 'tokyo', checkIn: '06/06/2026', checkOut: '10/06/2026', selectedAttractions: [] } as any,
    ], null, []);

    expect(service.activeStop()?.cityId).toBe('paris');
  });
});

describe('TripService — day jump request (feedback round 2, item 2)', () => {
  let trip: TripService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
  });

  it('starts with no pending request', () => {
    expect(trip.dayJumpRequest()).toBeNull();
  });

  it('requestDayJump sets the request; consumeDayJumpRequest clears it', () => {
    trip.requestDayJump('stop-1', '02/06');
    expect(trip.dayJumpRequest()).toEqual({ stopId: 'stop-1', dayKey: '02/06' });

    trip.consumeDayJumpRequest();
    expect(trip.dayJumpRequest()).toBeNull();
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

describe('TripService — personal activities (Feature 71)', () => {
  let service: TripService;
  let stopId: string;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
    service.addStop(PARIS, '01/10/2026', '03/10/2026');
    stopId = service.stops()[0].stopId;
  });

  it('addPersonalActivity stores the entry with endTime = start + meta minutes', () => {
    service.addPersonalActivity(stopId, { activityType: 'lunch', title: 'Almuerzo', isPrivate: false, startTime: '13:00', date: '01/10/2026' });
    const e = service.selectedAttractionsFor(stopId).at(-1)!;
    expect(e).toMatchObject({ activityType: 'lunch', title: 'Almuerzo', isPrivate: false, startTime: '13:00', endTime: '14:00', date: '01/10/2026' });
    expect(e.attractionId).toBeUndefined();
    expect(e.entryId).toBeTruthy();
  });
  it('updatePersonalActivity keeps the duration when the start moves', () => {
    service.addPersonalActivity(stopId, { activityType: 'dinner', title: 'Cena', isPrivate: false, startTime: '20:00' });
    const id = service.selectedAttractionsFor(stopId).at(-1)!.entryId;
    service.updatePersonalActivity(stopId, id, { title: 'Cena tía', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: true, startTime: '21:00' });
    expect(service.selectedAttractionsFor(stopId).at(-1)).toMatchObject({ title: 'Cena tía', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: true, startTime: '21:00', endTime: '22:30' });
  });
  it('updatePersonalActivity with mapsUrl undefined removes the link', () => {
    service.addPersonalActivity(stopId, { activityType: 'walk', title: 'Paseo', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: false, startTime: '10:00' });
    const id = service.selectedAttractionsFor(stopId).at(-1)!.entryId;
    service.updatePersonalActivity(stopId, id, { title: 'Paseo', isPrivate: false, startTime: '10:00' });
    expect(service.selectedAttractionsFor(stopId).at(-1)!.mapsUrl).toBeUndefined();
  });
  it('restoring stops keeps personal fields and ticketPurchased (migrateAttraction)', () => {
    service.restoreStops([{ stopId: 's9', cityId: 'paris', checkIn: '01/10/2026', checkOut: '03/10/2026', selectedAttractions: [
      { entryId: 'e1', activityType: 'coffee', title: 'Café', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: true, startTime: '16:00', endTime: '16:30' } as any,
      { entryId: 'e2', attractionId: 'paris_0', startTime: '10:00', endTime: null, ticketPurchased: true } as any,
    ] }] as any);
    const [p, c] = service.selectedAttractionsFor('s9');
    expect(p).toMatchObject({ activityType: 'coffee', title: 'Café', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: true });
    expect(c).toMatchObject({ attractionId: 'paris_0', ticketPurchased: true });
    expect(c.activityType).toBeUndefined();
  });
});
