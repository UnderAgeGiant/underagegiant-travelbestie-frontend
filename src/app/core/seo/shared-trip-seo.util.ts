import { WORLD_CITIES } from '../../data/cities.data';
import type { TripStop } from '../models/trip.model';
import type { SeoPage } from './seo.service';
import { SEO_DESCRIPTION_MAX, SEO_MIN_ATTRACTIONS, SEO_TITLE_MAX, joinList, truncate } from './seo.util';

let cityNames: Map<string, string> | null = null;
function cityName(cityId: string): string | undefined {
  cityNames ??= new Map(WORLD_CITIES.map(c => [c.id, c.name]));
  return cityNames.get(cityId);
}

export function sharedTripSeo(
  trip: { id: string; tripName: string; stops: TripStop[] },
  locale: string,
): SeoPage {
  const cities = [...new Set(trip.stops.map(s => cityName(s.cityId)).filter((n): n is string => !!n))];
  const attractionCount = trip.stops.reduce((n, s) => n + s.selectedAttractions.length, 0);
  const indexable = attractionCount >= SEO_MIN_ATTRACTIONS && cities.length > 0;

  const name = trip.tripName;
  const list = joinList(cities, locale);
  const title = truncate($localize`:@@seo.shared.title:${name}:NAME: — itinerario en Tripilove`, SEO_TITLE_MAX);
  const description = truncate(
    $localize`:@@seo.shared.description:Itinerario por ${list}:CITIES: con ${attractionCount}:COUNT: atracciones planificadas. Créalo, edítalo y compártelo en Tripilove.`,
    SEO_DESCRIPTION_MAX,
  );

  return {
    title,
    description,
    path: `/shared/${encodeURIComponent(trip.id)}`,
    noindex: !indexable,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: trip.tripName,
      description,
      itinerary: {
        '@type': 'ItemList',
        itemListElement: cities.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'City', name: c },
        })),
      },
    },
  };
}

export function sharedTripNotFoundSeo(): SeoPage {
  return { title: $localize`:@@seo.sharedNotFound.title:Viaje no encontrado | Tripilove`, noindex: true };
}
