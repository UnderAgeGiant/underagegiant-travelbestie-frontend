import { Attraction } from '../models/comment.model';
import { PlannedAttraction } from '../models/trip.model';
import { activityMeta } from '../models/personal-activity.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions, findCuratedAttraction } from '../../data/attractions.data';

export function isPersonal(p: { activityType?: string }): boolean {
  return !!p.activityType;
}

/** A personal entry dressed as an Attraction so existing renderers (names, icons, durations,
 *  schedule lists) work unchanged. name AND nameEn are the stored title: it's user text. */
export function personalAttraction(p: { activityType?: string; title?: string }): Attraction {
  const m = activityMeta(p.activityType);
  const title = p.title?.trim() || m.label;
  return {
    id: `personal:${m.type}`, name: title, nameEn: title, type: m.label, category: 'poi', active: true,
    icon: m.icon, bg: m.bg, rating: 0, estimatedMinutes: m.minutes, ...(m.image ? { imageUrl: m.image } : {}),
  };
}

/** Single lookup for "what does this planned entry show as": personal → synthetic, catalog → active list, then curated (inactive still renders). */
export function resolvePlannedAttraction(
  cityId: string,
  p: Pick<PlannedAttraction, 'attractionId' | 'activityType' | 'title'>,
): Attraction | null {
  if (isPersonal(p)) return personalAttraction(p);
  if (!p.attractionId) return null;
  const city = WORLD_CITIES.find(c => c.id === cityId);
  return (city ? getAttractions(city).find(a => a.id === p.attractionId) : undefined)
    ?? findCuratedAttraction(cityId, p.attractionId) ?? null;
}
