import { attractionMapsUrl, dayRouteUrl, transitTerminalName, MAX_ROUTE_WAYPOINTS } from './google-maps-url.util';
import { WORLD_CITIES } from '../../data/cities.data';

// Any real city — assertions derive name/country from the same entry.
const CITY = WORLD_CITIES[0];
const q = (name: string) => encodeURIComponent(`${name}, ${CITY.name}, ${CITY.country}`);

describe('attractionMapsUrl', () => {
  it('builds a search URL with name, city and country', () => {
    const url = attractionMapsUrl('Torre Eiffel', CITY.id);
    expect(url).toBe(`https://www.google.com/maps/search/?api=1&query=${q('Torre Eiffel')}`);
  });

  it('falls back to the bare name for an unknown cityId', () => {
    expect(attractionMapsUrl('Museo X', 'no-such-city'))
      .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Museo X')}`);
  });
});

describe('dayRouteUrl', () => {
  it('returns null with fewer than 2 route points', () => {
    expect(dayRouteUrl([], CITY.id)).toBeNull();
    expect(dayRouteUrl(['Solo una'], CITY.id)).toBeNull();
  });

  it('routes a single attraction when lodging provides origin and destination', () => {
    const url = dayRouteUrl(['Torre Eiffel'], CITY.id, 'Hotel Le Central', 'Hotel Le Central')!;
    expect(url).toContain(`origin=${q('Hotel Le Central')}`);
    expect(url).toContain(`destination=${q('Hotel Le Central')}`);
    expect(url).toContain(`waypoints=${q('Torre Eiffel')}`);
    expect(url).toContain('travelmode=walking');
  });

  it('supports an asymmetric origin/destination (e.g. arrival terminal vs. lodging)', () => {
    const url = dayRouteUrl(['Torre Eiffel'], CITY.id, 'Aeropuerto', 'Hotel Le Central')!;
    expect(url).toContain(`origin=${q('Aeropuerto')}`);
    expect(url).toContain(`destination=${q('Hotel Le Central')}`);
    expect(url).toContain(`waypoints=${q('Torre Eiffel')}`);
  });

  it('uses only an origin override when no destination override is given', () => {
    const url = dayRouteUrl(['Torre Eiffel'], CITY.id, 'Hotel Le Central')!;
    expect(url).toContain(`origin=${q('Hotel Le Central')}`);
    expect(url).toContain(`destination=${q('Torre Eiffel')}`);
  });

  it('uses first as origin, last as destination, middles as pipe-separated waypoints', () => {
    const url = dayRouteUrl(['A', 'B', 'C', 'D'], CITY.id)!;
    expect(url).toContain(`origin=${q('A')}`);
    expect(url).toContain(`destination=${q('D')}`);
    const expectedWaypoints = encodeURIComponent(
      [`B, ${CITY.name}, ${CITY.country}`, `C, ${CITY.name}, ${CITY.country}`].join('|'),
    );
    expect(url).toContain(`waypoints=${expectedWaypoints}`);
  });

  it('caps waypoints at MAX_ROUTE_WAYPOINTS keeping origin and destination intact', () => {
    const names = Array.from({ length: 15 }, (_, i) => `P${i}`);
    const url = dayRouteUrl(names, CITY.id)!;
    expect(url).toContain(`origin=${q('P0')}`);
    expect(url).toContain(`destination=${q('P14')}`);
    const waypointsParam = new URL(url).searchParams.get('waypoints')!;
    expect(waypointsParam.split('|')).toHaveLength(MAX_ROUTE_WAYPOINTS);
  });
});

describe('transitTerminalName', () => {
  it('returns a terminal search term for flight, train and boat', () => {
    expect(transitTerminalName('flight')).toBe('Aeropuerto');
    expect(transitTerminalName('train')).toBe('Estación de tren');
    expect(transitTerminalName('boat')).toBe('Puerto');
  });

  it('returns null for bus and car (no fixed terminal)', () => {
    expect(transitTerminalName('bus')).toBeNull();
    expect(transitTerminalName('car')).toBeNull();
  });
});
