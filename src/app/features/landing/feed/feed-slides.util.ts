import { FeedPlan } from '../../../core/models/feed-plan.model';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions, findCuratedAttraction } from '../../../data/attractions.data';
import { localizedDescription } from '../../../core/utils/attraction-description.util';
import { AppLocale } from '../../../core/i18n/locale.util';
import { CITY_COVER_PHOTOS } from '../city-cover-photos.data';

/** One attraction slide in a feed card (page 1..N; page 0 is the map). */
export interface FeedSlide {
  id: string;                 // `${stopIdx}:${attIdx}:${attractionId}` — unique within a plan
  attractionId: string;
  name: string;
  cityId: string;
  cityName: string;
  icon: string;
  type: string;
  rating: number | null;
  imageUrl: string | null;
  description: string | null;
  date: string | null;        // dd/mm/yyyy
  startTime: string | null;   // HH:mm
}

const LAST = Number.MAX_SAFE_INTEGER;

function dmyKey(dmy?: string): number {
  if (!dmy) return LAST;
  const [d, m, y] = dmy.split('/').map(Number);
  const t = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(t) ? LAST : t;
}
function hmKey(hm: string | null): number {
  if (!hm) return LAST;
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Every attraction of the plan, trip-stop order, each stop's attractions sorted by day then start time
 *  (untimed ones last, ties keep their stored order). Display-only — never mutates the plan. */
export function buildFeedSlides(plan: FeedPlan, locale: AppLocale): FeedSlide[] {
  const slides: FeedSlide[] = [];
  plan.stops.forEach((stop, stopIdx) => {
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    const ordered = stop.selectedAttractions
      .map((planned, attIdx) => ({ planned, attIdx }))
      .sort((a, b) =>
        (dmyKey(a.planned.date ?? stop.checkIn) - dmyKey(b.planned.date ?? stop.checkIn))
        || (hmKey(a.planned.startTime) - hmKey(b.planned.startTime))
        || (a.attIdx - b.attIdx));

    for (const { planned, attIdx } of ordered) {
      const att = findCuratedAttraction(stop.cityId, planned.attractionId)
        ?? (city ? getAttractions(city).find(a => a.id === planned.attractionId) : undefined);
      if (!att) continue;
      slides.push({
        id: `${stopIdx}:${attIdx}:${planned.attractionId}`,
        attractionId: planned.attractionId,
        name: att.name,
        cityId: stop.cityId,
        cityName: city?.name ?? stop.cityId,
        icon: att.icon,
        type: att.type,
        rating: typeof att.rating === 'number' ? att.rating : null,
        imageUrl: att.imageUrl ?? att.images?.[0] ?? CITY_COVER_PHOTOS[stop.cityId] ?? null,
        description: localizedDescription(att, locale) ?? null,
        date: planned.date ?? stop.checkIn ?? null,
        startTime: planned.startTime,
      });
    }
  });
  return slides;
}
