import { TestBed } from '@angular/core/testing';
import { TripService } from './trip.service';
import { City } from '../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };
const TOKYO: City = { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'asia' };

describe('TripService', () => {
  let service: TripService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new TripService();
  });

  it('starts with no stops', () => {
    expect(service.stops()).toEqual([]);
  });

  it('addStop appends a stop and sets it active', () => {
    service.addStop(PARIS, '2026-06-01', '2026-06-05');
    expect(service.stops()).toHaveLength(1);
    expect(service.stops()[0].cityId).toBe('paris');
    expect(service.activeId()).toBe('paris');
  });

  it('removeStop removes and activates next', () => {
    service.addStop(PARIS, '', '');
    service.addStop(TOKYO, '', '');
    service.removeStop('paris');
    expect(service.stops()).toHaveLength(1);
    expect(service.stops()[0].cityId).toBe('tokyo');
  });

  it('removeStop sets activeId to null when last stop removed', () => {
    service.addStop(PARIS, '', '');
    service.removeStop('paris');
    expect(service.stops()).toHaveLength(0);
    expect(service.activeId()).toBeNull();
  });

  it('existingCityIds returns array of cityIds', () => {
    service.addStop(PARIS, '', '');
    expect(service.existingCityIds()).toContain('paris');
  });
});
