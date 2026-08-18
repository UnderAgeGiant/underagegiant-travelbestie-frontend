import { buildItineraryExportMaps } from './itinerary-export.util';
import { TripStop } from '../models/trip.model';

function stop(cityId: string): TripStop {
  return { stopId: cityId, cityId, checkIn: '01/01/2026', checkOut: '02/01/2026', selectedAttractions: [] };
}

describe('buildItineraryExportMaps', () => {
  it('returns empty maps for an empty stops array', () => {
    expect(buildItineraryExportMaps([])).toEqual({
      cityNames: {},
      attractionNames: {},
      ticketRequiredIds: [],
    });
  });

  it('skips a stop whose cityId is not in WORLD_CITIES', () => {
    const result = buildItineraryExportMaps([stop('atlantis')]);
    expect(result.cityNames).toEqual({});
    expect(result.attractionNames).toEqual({});
    expect(result.ticketRequiredIds).toEqual([]);
  });

  it('maps a known city\'s name and its attractions, flagging ticketed ones', () => {
    const result = buildItineraryExportMaps([stop('paris')]);
    expect(result.cityNames['paris']).toBe('Paris');
    expect(result.attractionNames['paris_0']).toBe('Paris, Banks of the Seine');
    expect(result.ticketRequiredIds).toContain('paris_0');
  });

  it('merges attractions across multiple stops without dropping either city', () => {
    const result = buildItineraryExportMaps([stop('paris'), stop('rome')]);
    expect(Object.keys(result.cityNames)).toEqual(['paris', 'rome']);
    expect(result.attractionNames['paris_0']).toBeDefined();
    expect(Object.keys(result.attractionNames).length).toBeGreaterThan(1);
  });
});
