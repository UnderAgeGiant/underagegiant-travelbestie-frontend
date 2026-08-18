import { buildPlanSlideshowItems } from './plan-slideshow.util';
import { TripStop, TransitLeg } from '../../core/models/trip.model';

const PARIS_0_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Paris_75005_Quai_de_Montebello_Bouquinistes_20071014.jpg/1920px-Paris_75005_Quai_de_Montebello_Bouquinistes_20071014.jpg';

const PARIS_STOP: TripStop = {
  stopId: 'stop-1',
  cityId: 'paris',
  checkIn: '10/08/2026',
  checkOut: '12/08/2026',
  selectedAttractions: [
    { entryId: 'e1', attractionId: 'paris_0', startTime: '09:00', endTime: null, date: '10/08/2026' },
    { entryId: 'e2', attractionId: 'unknown_id', startTime: null, endTime: null, date: '10/08/2026' },
  ],
};

const START_TO_PARIS: TransitLeg = {
  fromCityId: '__start__',
  toCityId: 'paris',
  segments: [
    { mode: 'flight', departureDate: '09/08/2026', departureTime: '20:00', arrivalDate: '10/08/2026', arrivalTime: '07:30', notes: '' },
  ],
};

describe('buildPlanSlideshowItems', () => {
  it('excludes planned attractions without a startTime', () => {
    const items = buildPlanSlideshowItems([PARIS_STOP], []);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('att:e1');
  });

  it('resolves name, type, icon and image from curated data', () => {
    const [item] = buildPlanSlideshowItems([PARIS_STOP], []);
    expect(item.name).toBe('Paris, Banks of the Seine');
    expect(item.type).toBe('Histórico');
    expect(item.icon).toBe('🏛️');
    expect(item.imageUrl).toBe(PARIS_0_IMAGE);
  });

  it('defaults endTime from estimatedMinutes when the planned attraction has none', () => {
    const [item] = buildPlanSlideshowItems([PARIS_STOP], []);
    expect(item.startDate).toBe('10/08/2026');
    expect(item.startTime).toBe('09:00');
    expect(item.endDate).toBe('10/08/2026');
    expect(item.endTime).toBe('11:00'); // 09:00 + 120min estimatedMinutes
  });

  it('includes transit segments with mode label, icon, and null imageUrl', () => {
    const items = buildPlanSlideshowItems([], [START_TO_PARIS]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'transit:__start__:paris:0',
      name: '🏠 → Paris',
      type: 'Vuelo',
      icon: '✈️',
      imageUrl: null,
      startDate: '09/08/2026',
      startTime: '20:00',
      endDate: '10/08/2026',
      endTime: '07:30',
    });
  });

  it('sorts attractions and transit chronologically across stops and legs', () => {
    const items = buildPlanSlideshowItems([PARIS_STOP], [START_TO_PARIS]);
    expect(items.map(i => i.id)).toEqual(['transit:__start__:paris:0', 'att:e1']);
  });

  it('drops transit segments missing a departure date/time', () => {
    const noDeparture: TransitLeg = {
      fromCityId: 'paris', toCityId: 'rome',
      segments: [{ mode: 'train', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', notes: '' }],
    };
    expect(buildPlanSlideshowItems([], [noDeparture])).toHaveLength(0);
  });
});
