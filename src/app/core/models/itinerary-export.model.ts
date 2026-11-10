import { AppLocale } from '../i18n/locale.util';
import { DayHours, WeekDay } from './comment.model';

/** Mirror of the POST /trips/:id/itinerary body (contract §2.5, plan F78 "Shared contract"). Every field optional. */
export interface ItineraryExportBody {
  locale?: AppLocale;
  cityNames?: Record<string, string>;
  attractionNames?: Record<string, string>;         // planned catalog attractions only
  ticketRequiredIds?: string[];
  attractionDurations?: Record<string, number>;     // minutes
  attractionDetails?: Record<string, AttractionDetail>;
  personalLabels?: Record<string, string>;          // activityType → label in the app language
  destinations?: DestinationFacts[];
  currency?: string;                                // ISO 4217
  siteUrl?: string;
}

export interface AttractionDetail {
  nativeName?: string;
  type?: string;
  rating?: number;
  schedule?: Partial<Record<WeekDay, DayHours>>;
  website?: string;
  ticketUrl?: string;
  description?: string;
}

export interface DestinationFacts {
  country: string;            // display name in the app language
  flag?: string;
  visa?: string;              // already-localized label, or the "set your country" CTA text
  currency?: string;
  plug?: string;
  cities: { name: string; timeDiff?: string }[];   // timeDiff only when the timezone is known
}
