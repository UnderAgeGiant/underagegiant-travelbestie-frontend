import type { City } from '../../core/models/city.model';
import type { CityGuideEntry } from '../../data/city-guides.data';
import { HOME_TIME_ZONE } from '../../data/city-guides.data';
import { getVisaRequirementMeta } from '../../core/models/visa-requirement.model';
import type { VisaRequirementService } from '../../core/visa/visa-requirement.service';
import type { TravelInfoService } from '../../core/travel-info/travel-info.service';
import { formatCurrencyLabel, formatPlugLabel } from '../../core/models/travel-info-badge.model';
import { countryCodeFromFlagEmoji } from '../../shared/flag-icon/flag-emoji.util';
import { hoursAheadOf, timeDifferenceLabel } from './time-difference.util';

const HOME_ISO2 = 'CL';

export interface GuideFacts {
  visa: { icon: string; label: string } | null;
  currency: string | null;
  plug: string | null;
  timeDifference: string;
}

export function computeGuideFacts(
  city: City,
  entry: CityGuideEntry,
  now: Date,
  deps: { visa: VisaRequirementService; travelInfo: TravelInfoService },
): GuideFacts {
  const dest = countryCodeFromFlagEmoji(city.flag);
  let visa: GuideFacts['visa'] = null;
  let currency: string | null = null;
  let plug: string | null = null;

  if (dest) {
    const v = deps.visa.requirement(HOME_ISO2, dest);
    if (v) { const m = getVisaRequirementMeta(v.category, v.days); visa = { icon: m.icon, label: m.label }; }
    const c = deps.travelInfo.currencyInfo(dest);
    if (c) currency = formatCurrencyLabel(c.name, c.symbol);
    const p = deps.travelInfo.plugInfo(dest, HOME_ISO2);
    if (p) plug = formatPlugLabel(p.plugTypes, p.voltages, p.adapterNeeded);
  }
  return { visa, currency, plug, timeDifference: timeDifferenceLabel(hoursAheadOf(HOME_TIME_ZONE, entry.timeZone, now)) };
}
