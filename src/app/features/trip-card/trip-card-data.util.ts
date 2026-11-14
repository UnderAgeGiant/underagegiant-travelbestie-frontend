import { SharedTrip } from '../../core/shared-trips/shared-trips.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { stayLength } from '../../core/utils/event-datetime.util';
import { buildShareLink } from '../../core/share/share-url.util';
import { environment } from '../../../environments/environment';

export interface TripCardCity { flag: string; name: string; days: number | null }
export interface TripCardData {
  author: string | null;
  title: string;
  stats: { cities: number; places: number; days: number | null };
  cities: TripCardCity[];
  moreCities: number;
  link: string;
  siteLabel: string;
}

const MAX_ROWS = 5;
const PROD_SITE = 'https://tripilove.com';

/** The card points at production even when made on a local build, whose siteUrl is localhost. */
function cardSite(siteUrl: string): string {
  const site = siteUrl.replace(/\/+$/, '');
  return /\/\/(localhost|127\.0\.0\.1)(:|$)/.test(site) ? PROD_SITE : site;
}

/** The only place the card URL is assembled (F81 adds the referral code here). */
export function tripCardLink(shareId: string, siteUrl: string = environment.siteUrl): string {
  return `${buildShareLink(shareId, cardSite(siteUrl))}?utm_source=card`;
}

export function buildTripCardData(trip: SharedTrip, shareId: string, siteUrl: string = environment.siteUrl): TripCardData {
  const stops = trip.stops ?? [];
  const cities = stops.map(s => {
    const city = WORLD_CITIES.find(c => c.id === s.cityId);
    return { flag: city?.flag ?? '📍', name: city?.name ?? '', days: stayLength([s])?.days ?? null };
  });
  return {
    author: trip.ownerUsername ? `@${trip.ownerUsername}` : null,
    title: trip.tripName,
    stats: {
      cities: new Set(stops.map(s => s.cityId)).size,
      places: stops.reduce((n, s) => n + (s.selectedAttractions?.length ?? 0), 0),
      days: stayLength(stops)?.days ?? null,
    },
    cities: cities.slice(0, MAX_ROWS),
    moreCities: Math.max(0, cities.length - MAX_ROWS),
    link: tripCardLink(shareId, siteUrl),
    siteLabel: cardSite(siteUrl).replace(/^https?:\/\//, ''),
  };
}

export function tripCardFileName(title: string): string {
  const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return `tripilove-${slug || 'viaje'}.png`;
}
