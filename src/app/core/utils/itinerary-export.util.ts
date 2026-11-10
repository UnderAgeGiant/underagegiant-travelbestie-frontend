import { TripStop } from '../models/trip.model';
import { Attraction, WeekDay } from '../models/comment.model';
import { AttractionDetail, ItineraryExportBody } from '../models/itinerary-export.model';
import { getPersonalActivityMetas } from '../models/personal-activity.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { AppLocale } from '../i18n/locale.util';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { attractionName } from './attraction-name.util';
import { localizedDescription } from './attraction-description.util';
import { isPersonal, resolvePlannedAttraction } from './personal-activity.util';
import { buildDestinationFacts } from './destination-facts.util';

export interface ItineraryExportDeps {
  homeIso2: string | null;
  siteUrl: string;
  visa: VisaRequirementService;
  info: TravelInfoService;
}

// Backend zod limits (manager src/schemas/itinerary.schemas.ts) — a body over them is a 400.
const MAX_TEXT = 200, MAX_FACT = 300, MAX_DESCRIPTION = 1000, MAX_URL = 500, MAX_DETAILS = 400;
const DAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const HHMM = /^\d{2}:\d{2}$/;

/** Text: cut to `max` with "…". */
function clip(s: string | null | undefined, max = MAX_TEXT): string | undefined {
  if (!s) return undefined;
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

/** URLs are never cut: anything not a short, parseable http(s) URL is dropped. */
function safeUrl(s: string | null | undefined, max = MAX_URL): string | undefined {
  if (!s || s.length > max || !/^https?:\/\//i.test(s)) return undefined;
  try { new URL(s); return s; } catch { return undefined; }
}

function detailOf(att: Attraction, locale: AppLocale): AttractionDetail {
  const d: AttractionDetail = {};
  const nativeName = clip(att.nativeName);
  if (nativeName) d.nativeName = nativeName;
  const type = clip(att.type);
  if (type) d.type = type;
  if (typeof att.rating === 'number' && att.rating >= 0 && att.rating <= 5) d.rating = att.rating;
  const schedule: AttractionDetail['schedule'] = {};
  for (const day of DAYS) {
    const h = att.schedule?.[day];
    if (h && h !== 'closed' && HHMM.test(h.open) && HHMM.test(h.close)) schedule[day] = { open: h.open, close: h.close };
  }
  if (Object.keys(schedule).length) d.schedule = schedule;
  const website = safeUrl(att.website);
  if (website) d.website = website;
  const ticketUrl = safeUrl(att.ticketUrl);
  if (ticketUrl) d.ticketUrl = ticketUrl;
  const description = clip(localizedDescription(att, locale), MAX_DESCRIPTION);
  if (description) d.description = description;
  return d;
}

/** Builds the POST /trips/:id/itinerary body from the trip's stops (planned entries only). */
export function buildItineraryExportBody(stops: TripStop[], locale: AppLocale, deps: ItineraryExportDeps): ItineraryExportBody {
  const cityNames: Record<string, string> = {};
  const attractionNames: Record<string, string> = {};
  const attractionDurations: Record<string, number> = {};
  const attractionDetails: Record<string, AttractionDetail> = {};
  const ticketRequiredIds = new Set<string>();
  const personalTypes = new Set<string>();

  for (const stop of stops) {
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    if (city) cityNames[stop.cityId] = clip(city.name)!;
    for (const p of stop.selectedAttractions) {
      if (isPersonal(p)) { personalTypes.add(p.activityType!); continue; }
      const att = p.attractionId ? resolvePlannedAttraction(stop.cityId, p) : null;
      if (!att || att.id in attractionNames) continue;
      attractionNames[att.id] = clip(attractionName(att, locale))!;
      const mins = att.estimatedMinutes;
      if (Number.isInteger(mins) && mins > 0 && mins <= 1440) attractionDurations[att.id] = mins; // backend: int 0–1440
      if (att.ticketUrl) ticketRequiredIds.add(att.id);
      // ponytail: details stop at the backend's 400-entry cap; later attractions export name-only.
      if (Object.keys(attractionDetails).length < MAX_DETAILS) attractionDetails[att.id] = detailOf(att, locale);
    }
  }

  const personalLabels: Record<string, string> = {};
  for (const m of getPersonalActivityMetas()) if (personalTypes.has(m.type)) personalLabels[m.type] = clip(m.label)!;

  const destinations = buildDestinationFacts(stops, deps.homeIso2, deps.visa, deps.info, locale).slice(0, 30).map(d => ({
    ...d,
    country: clip(d.country)!,
    visa: clip(d.visa, MAX_FACT),
    currency: clip(d.currency, MAX_FACT),
    plug: clip(d.plug, MAX_FACT),
    cities: d.cities.slice(0, 60).map(c => ({ ...c, name: clip(c.name)!, timeDiff: clip(c.timeDiff) })),
  }));

  // The viewer's currency from their country (the backend converts with its own FX; unknown rate → USD only).
  const code = deps.homeIso2 ? deps.info.currencyInfo(deps.homeIso2)?.code : undefined;
  const siteUrl = safeUrl(deps.siteUrl, MAX_TEXT);

  return {
    locale,
    cityNames,
    attractionNames,
    ticketRequiredIds: [...ticketRequiredIds],
    attractionDurations,
    attractionDetails,
    personalLabels,
    destinations,
    currency: code && /^[A-Z]{3}$/.test(code) ? code : 'USD',
    ...(siteUrl ? { siteUrl } : {}),
  };
}
