import { SharedTrip } from '../../core/shared-trips/shared-trips.service';
import { TripStop } from '../../core/models/trip.model';
import { buildTripCardData, tripCardFileName, tripCardLink } from './trip-card-data.util';

const SITE = 'https://tripilove.com';

function stop(cityId: string, checkIn: string, checkOut: string, places: number): TripStop {
  return {
    stopId: `${cityId}-${checkIn}`, cityId, checkIn, checkOut,
    selectedAttractions: Array.from({ length: places }, (_, i) => ({ attractionId: `${cityId}_${i}` }) as never),
  };
}

const trip: SharedTrip = {
  id: 's1', ownerEmail: 'a@b.com', ownerName: 'Ana Viajera', ownerUsername: 'ana',
  tripName: 'Europa en 21 días', createdAt: '2027-01-01', transits: [],
  stops: [
    stop('paris',  '01/06/2027', '03/06/2027', 10),
    stop('rome',   '04/06/2027', '06/06/2027', 10),
    stop('lisbon', '07/06/2027', '09/06/2027', 10),
    stop('madrid', '10/06/2027', '12/06/2027', 10),
    stop('vienna', '13/06/2027', '15/06/2027', 10),
    stop('prague', '16/06/2027', '18/06/2027', 6),
    stop('paris',  '19/06/2027', '21/06/2027', 5),
  ],
};

describe('tripCardLink', () => {
  it('uses siteUrl, never window.location', () =>
    expect(tripCardLink('abc', 'https://tripilove.com')).toBe('https://tripilove.com/shared/abc?utm_source=card'));
  it('strips a trailing slash', () =>
    expect(tripCardLink('abc', 'https://tripilove.com/')).toBe('https://tripilove.com/shared/abc?utm_source=card'));
  it('a logged-in sharer: keeps utm_source=card and adds ref and via=card', () =>
    expect(tripCardLink('abc', 'https://x', 'ana7k2xq')).toBe('https://x/shared/abc?utm_source=card&ref=ana7k2xq&via=card'));
  it('no code: same link as before F81', () =>
    expect(tripCardLink('abc', 'https://x', null)).toBe('https://x/shared/abc?utm_source=card'));
  it('a localhost siteUrl (dev build) still points at production', () =>
    expect(tripCardLink('abc', 'http://localhost:4200')).toBe('https://tripilove.com/shared/abc?utm_source=card'));
});

describe('buildTripCardData', () => {
  const d = buildTripCardData(trip, 's1', SITE);

  it('counts distinct cities, all planned places and trip days', () =>
    expect(d.stats).toEqual({ cities: 6, places: 61, days: 21, nights: 20 }));
  it('lists 5 stops in trip order, then the rest as moreCities', () => {
    expect(d.cities.map(c => c.name)).toEqual(['Paris', 'Rome', 'Lisbon', 'Madrid', 'Vienna']);
    expect(d.moreCities).toBe(2);
  });
  it('per-city days: nights for every stop but the last, so the travel day goes to the next city', () => {
    const x = buildTripCardData({ ...trip, stops: [stop('lima', '01/06/2027', '05/06/2027', 1), stop('cusco', '05/06/2027', '09/06/2027', 1)] }, 'x', SITE);
    expect(x.cities.map(c => [c.days, c.nights])).toEqual([[4, 4], [5, 4]]);
    expect([x.stats.days, x.stats.nights]).toEqual([9, 8]);
    expect(d.cities[0].days).toBe(2);
  });
  it('a single-day trip has 1 day and no nights', () => {
    const x = buildTripCardData({ ...trip, stops: [stop('lima', '01/06/2027', '01/06/2027', 1)] }, 'x', SITE);
    expect(x.cities[0]).toMatchObject({ days: 1, nights: null });
    expect(x.stats).toMatchObject({ days: 1, nights: null });
  });
  it('a same-day stop shows no days', () => {
    const x = buildTripCardData({ ...trip, stops: [stop('lima', '01/06/2027', '01/06/2027', 1), stop('cusco', '01/06/2027', '03/06/2027', 1)] }, 'x', SITE);
    expect(x.cities.map(c => [c.days, c.nights])).toEqual([[null, null], [3, 2]]);
  });
  it('carries the flag emoji', () => expect(d.cities[0].flag).toBe('🇫🇷'));
  it('author is @username, null without one', () => {
    expect(d.author).toBe('@ana');
    expect(buildTripCardData({ ...trip, ownerUsername: null }, 'x', SITE).author).toBeNull();
  });
  it('never reads ownerName or ownerEmail', () =>
    expect(JSON.stringify(d)).not.toMatch(/Ana Viajera|a@b\.com/));
  it('missing dates → days null, no NaN', () => {
    const x = buildTripCardData({ ...trip, stops: [{ ...trip.stops[0], checkIn: '', checkOut: '' }] }, 'x', SITE);
    expect(x.stats.days).toBeNull();
    expect(x.stats.nights).toBeNull();
    expect(x.cities[0].days).toBeNull();
    expect(x.cities[0].nights).toBeNull();
  });
  it('unknown cityId → 📍 and an empty name, never the raw id', () => {
    const x = buildTripCardData({ ...trip, stops: [stop('zz-nowhere', '01/06/2027', '02/06/2027', 1)] }, 'x', SITE);
    expect(x.cities[0]).toEqual({ flag: '📍', name: '', days: 2, nights: 1 });
    expect(JSON.stringify(x)).not.toContain('zz-nowhere');
  });
  it('siteLabel drops the scheme', () => expect(d.siteLabel).toBe('tripilove.com'));
  it('link is the card link', () => expect(d.link).toBe('https://tripilove.com/shared/s1?utm_source=card'));
});

describe('tripCardFileName', () => {
  it('slugs the title', () => expect(tripCardFileName('Europa en 21 días!')).toBe('tripilove-europa-en-21-dias.png'));
  it('falls back when empty', () => expect(tripCardFileName('  ')).toBe('tripilove-viaje.png'));
});
