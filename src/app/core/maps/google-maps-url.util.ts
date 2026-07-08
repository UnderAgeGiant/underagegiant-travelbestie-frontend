import { WORLD_CITIES } from '../../data/cities.data';

/**
 * Keyless Google Maps deep links ("Maps URLs" scheme). The `api=1` marker is
 * the URL-format version — NOT the billable Maps API; no key is involved.
 * Queries are name-based ("name, city, country"). A future coordinates
 * upgrade (query=lat,lng) only changes placeQuery — call sites stay as-is.
 */

/** Google's route cap: 9 waypoints on desktop/native app (mobile browsers honor only 3). */
export const MAX_ROUTE_WAYPOINTS = 9;

function placeQuery(name: string, cityId: string): string {
  const city = WORLD_CITIES.find(c => c.id === cityId);
  return city ? `${name}, ${city.name}, ${city.country}` : name;
}

/** Link to the attraction's place card (Google search resolves name + city + country). */
export function attractionMapsUrl(attractionName: string, cityId: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery(attractionName, cityId))}`;
}

/**
 * Walking route through the day's attractions in the given order.
 * When lodgingName is set it becomes origin AND destination (round trip
 * from the hotel). Returns null when there are fewer than 2 route points.
 */
export function dayRouteUrl(
  attractionNames: string[],
  cityId: string,
  lodgingName?: string | null,
): string | null {
  let places = attractionNames.map(n => placeQuery(n, cityId));
  if (lodgingName) {
    const lodging = placeQuery(lodgingName, cityId);
    places = [lodging, ...places, lodging];
  }
  if (places.length < 2) return null;

  const origin      = places[0];
  const destination = places[places.length - 1];
  const waypoints   = places.slice(1, -1).slice(0, MAX_ROUTE_WAYPOINTS);

  return 'https://www.google.com/maps/dir/?api=1'
    + `&origin=${encodeURIComponent(origin)}`
    + `&destination=${encodeURIComponent(destination)}`
    + (waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join('|'))}` : '')
    + '&travelmode=walking';
}
