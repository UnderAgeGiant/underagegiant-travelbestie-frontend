import { TripStop } from '../models/trip.model';
import { City } from '../models/city.model';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { VisaRequirementCategory } from '../models/visa-requirement.model';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { countryCodeFromFlagEmoji } from '../../shared/flag-icon/flag-emoji.util';

export interface TravelDocsSummary {
  visaStops: string[];
  currencies: string[];
  adapterStops: string[];
}

// Categories where the traveler must actually do something before the trip —
// 'visa_free' and 'visa_free_days' mean no visa action is required at all, so
// those stops are deliberately left out of visaStops.
const NEEDS_VISA_ACTION = new Set<VisaRequirementCategory>([
  'visa_on_arrival', 'eta', 'e_visa', 'visa_required', 'no_admission',
]);

/**
 * Pure summary builder for TravelDocsReminderComponent (Feedback item #4,
 * 2026-09-07 UX-improvements round): enumerates which stops need a visa,
 * which currencies the trip touches, and which stops need a plug adapter,
 * given the trip's stops and the viewer's home country.
 */
export function buildTravelDocsSummary(
  stops: TripStop[],
  homeIso2: string | null,
  cityLookup: (cityId: string) => City | null,
  visaService: VisaRequirementService,
  travelInfo: TravelInfoService,
): TravelDocsSummary {
  const visaStops = new Set<string>();
  const currencies = new Set<string>();
  const adapterStops = new Set<string>();

  for (const stop of stops) {
    const city = cityLookup(stop.cityId);
    if (!city) continue;
    const destIso2 = countryCodeFromFlagEmoji(city.flag);
    if (!destIso2) continue;

    if (homeIso2) {
      const visa = visaService.requirement(homeIso2, destIso2);
      if (visa && NEEDS_VISA_ACTION.has(visa.category)) visaStops.add(city.name);
    }

    const currency = travelInfo.currencyInfo(destIso2);
    if (currency) currencies.add(`${currency.name} (${currency.symbol})`);

    if (homeIso2) {
      const plug = travelInfo.plugInfo(destIso2, homeIso2);
      if (plug?.adapterNeeded === true) adapterStops.add(city.name);
    }
  }

  return {
    visaStops: [...visaStops],
    currencies: [...currencies],
    adapterStops: [...adapterStops],
  };
}
