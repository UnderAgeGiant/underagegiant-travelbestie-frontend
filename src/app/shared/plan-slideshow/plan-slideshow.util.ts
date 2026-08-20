import { TripStop, TransitLeg, PlannedAttraction, TransitMode } from '../../core/models/trip.model';
import { SlideshowItem } from '../../core/models/plan-slideshow.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions, findCuratedAttraction } from '../../data/attractions.data';
import { localizedDescription } from '../../core/utils/attraction-description.util';
import { AppLocale } from '../../core/i18n/locale.util';

function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minToHm(min: number): string {
  const clamped = Math.max(0, Math.min(min, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function typeIcon(type: string): string {
  switch (type) {
    case 'Parque Natural': return '🌿';
    case 'Patrimonio':     return '✨';
    default:               return '🏛️';
  }
}

const TRANSIT_ICON: Record<TransitMode, string> = {
  flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗',
};
const TRANSIT_LABEL: Record<TransitMode, string> = {
  flight: 'Vuelo', train: 'Tren', boat: 'Barco', bus: 'Bus', car: 'Auto',
};

function cityLabel(cityId: string): string {
  if (cityId === '__start__' || cityId === '__end__') return '🏠';
  return WORLD_CITIES.find(c => c.id === cityId)?.name ?? cityId;
}

function attractionSlideItem(stop: TripStop, planned: PlannedAttraction, locale: AppLocale): SlideshowItem | null {
  if (!planned.startTime) return null;
  const city = WORLD_CITIES.find(c => c.id === stop.cityId);
  const att = (city ? getAttractions(city) : []).find(a => a.id === planned.attractionId)
           ?? findCuratedAttraction(stop.cityId, planned.attractionId);

  const startMin = hmToMin(planned.startTime);
  const endMin   = planned.endTime ? hmToMin(planned.endTime) : startMin + (att?.estimatedMinutes ?? 60);
  const date     = planned.date ?? stop.checkIn ?? null;

  return {
    id:          `att:${planned.entryId}`,
    name:        att?.name ?? planned.attractionId,
    type:        att?.type ?? '',
    icon:        typeIcon(att?.type ?? ''),
    imageUrl:    att?.imageUrl ?? null,
    description: (att ? localizedDescription(att, locale) : undefined) ?? null,
    startDate:   date,
    startTime:   planned.startTime,
    endDate:     date,
    endTime:     minToHm(endMin),
  };
}

function transitSlideItems(leg: TransitLeg): SlideshowItem[] {
  return leg.segments
    .filter(seg => !!seg.departureDate && !!seg.departureTime)
    .map((seg, i) => ({
      id:          `transit:${leg.fromCityId}:${leg.toCityId}:${i}`,
      name:        `${cityLabel(leg.fromCityId)} → ${cityLabel(leg.toCityId)}`,
      type:        TRANSIT_LABEL[seg.mode] ?? 'Transporte',
      icon:        TRANSIT_ICON[seg.mode] ?? '🚀',
      imageUrl:    null,
      description: null,
      startDate:   seg.departureDate,
      startTime:   seg.departureTime,
      endDate:     seg.arrivalDate || seg.departureDate,
      endTime:     seg.arrivalTime || null,
    }));
}

function sortKey(item: SlideshowItem): number {
  if (!item.startDate || !item.startTime) return Number.MAX_SAFE_INTEGER;
  const [d, m, y]  = item.startDate.split('/').map(Number);
  const [h, mi]    = item.startTime.split(':').map(Number);
  const t = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0).getTime();
  return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

/** Chronologically-sorted slideshow items for an entire trip: every timed attraction across every stop, plus every transit segment. `locale` picks the language of each attraction's description caption. */
export function buildPlanSlideshowItems(stops: TripStop[], transits: TransitLeg[], locale: AppLocale): SlideshowItem[] {
  const items: SlideshowItem[] = [];
  for (const stop of stops) {
    for (const planned of stop.selectedAttractions) {
      const item = attractionSlideItem(stop, planned, locale);
      if (item) items.push(item);
    }
  }
  for (const leg of transits) items.push(...transitSlideItems(leg));
  return items.sort((a, b) => sortKey(a) - sortKey(b));
}
