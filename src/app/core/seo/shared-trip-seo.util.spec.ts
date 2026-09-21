import { sharedTripSeo, sharedTripNotFoundSeo } from './shared-trip-seo.util';
import { SEO_MIN_ATTRACTIONS } from './seo.util';
import type { TripStop } from '../models/trip.model';

function stop(cityId: string, n: number): TripStop {
  return {
    stopId: `s-${cityId}`, cityId, checkIn: '01/06/2026', checkOut: '05/06/2026',
    selectedAttractions: Array.from({ length: n }, (_, i) => ({
      entryId: `e${i}`, attractionId: `${cityId}_${i}`, startTime: null, endTime: null,
    })),
  };
}

describe('sharedTripSeo', () => {
  it('builds title, description, canonical path and TouristTrip JSON-LD for an indexable plan', () => {
    const seo = sharedTripSeo({ id: 'abc', tripName: 'Europa 2026', stops: [stop('paris', 2), stop('rome', 2)] }, 'es-CL');
    expect(seo.title).toContain('Europa 2026');
    expect(seo.title.length).toBeLessThanOrEqual(60);
    expect(seo.description!.length).toBeLessThanOrEqual(155);
    expect(seo.path).toBe('/shared/abc');
    expect(seo.noindex).toBe(false);
    expect((seo.jsonLd as any)['@type']).toBe('TouristTrip');
    expect((seo.jsonLd as any).itinerary.itemListElement).toHaveLength(2);
  });

  it('never leaks owner data', () => {
    const input = { id: 'abc', tripName: 'T', stops: [stop('paris', 3)], ...({ ownerName: 'Maria', ownerEmail: 'm@x.com' } as object) } as any;
    expect(input.ownerName).toBe('Maria'); // guard: the owner fields really are on the input
    const out = JSON.stringify(sharedTripSeo(input, 'es-CL'));
    expect(out).toContain('"path":"/shared/abc"'); // guard: the output is a real, non-empty SEO page
    expect(out).not.toContain('Maria');
    expect(out).not.toContain('m@x.com');
  });

  it('is noindex below the attraction floor', () => {
    const seo = sharedTripSeo({ id: 'abc', tripName: 'T', stops: [stop('paris', SEO_MIN_ATTRACTIONS - 1)] }, 'es-CL');
    expect(seo.noindex).toBe(true);
  });

  it('is noindex when no stop resolves to a known city', () => {
    const seo = sharedTripSeo({ id: 'abc', tripName: 'T', stops: [stop('no-such-city', 5)] }, 'es-CL');
    expect(seo.noindex).toBe(true);
  });
});

describe('sharedTripNotFoundSeo', () => {
  it('is noindex', () => expect(sharedTripNotFoundSeo().noindex).toBe(true));
});
