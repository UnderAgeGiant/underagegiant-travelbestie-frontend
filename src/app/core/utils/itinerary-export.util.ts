import { TripStop } from '../models/trip.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';

export interface ItineraryExportMaps {
  cityNames: Record<string, string>;
  attractionNames: Record<string, string>;
  ticketRequiredIds: string[];
}

/** Builds the payload maps for POST /trips/:id/itinerary from a trip's stops. */
export function buildItineraryExportMaps(stops: TripStop[]): ItineraryExportMaps {
  const cityNames: Record<string, string> = {};
  const attractionNames: Record<string, string> = {};
  const ticketRequiredIds: string[] = [];
  for (const stop of stops) {
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    if (!city) continue;
    cityNames[stop.cityId] = city.name;
    for (const att of getAttractions(city)) {
      attractionNames[att.id] = att.name;
      if (att.ticketUrl) ticketRequiredIds.push(att.id);
    }
  }
  return { cityNames, attractionNames, ticketRequiredIds };
}
