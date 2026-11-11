import { City } from '../models/city.model';
import { TripStop } from '../models/trip.model';
import { DestinationFacts } from '../models/itinerary-export.model';
import { getVisaRequirementMeta } from '../models/visa-requirement.model';
import { formatCurrencyLabel, formatPlugLabel } from '../models/travel-info-badge.model';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { AppLocale } from '../i18n/locale.util';
import { countryCodeFromFlagEmoji } from '../../shared/flag-icon/flag-emoji.util';
import { WORLD_CITIES } from '../../data/cities.data';
import { guideByCityId, HOME_TIME_ZONE } from '../../data/city-guides.data';
import { hoursAheadOf, timeDifferenceLabel } from '../../features/city-guide/time-difference.util';

export const SET_COUNTRY_CTA = $localize`:@@cityInfo.setCountryCta:Agrega tu país de residencia en Configuración de cuenta para ver info de visa`;

export interface CityFacts {
  visa: { icon: string; label: string; cta: boolean } | null;
  currency: { icon: string; label: string } | null;
  plug: { icon: string; label: string } | null;
}

/** Visa/currency/plug facts for one city — the CityInfoBadge rules (login gate stays in the badge). */
export function cityFacts(city: City, homeIso2: string | null, visa: VisaRequirementService, info: TravelInfoService): CityFacts {
  const dest = countryCodeFromFlagEmoji(city.flag);

  let visaFact: CityFacts['visa'] = null;
  if (!homeIso2) visaFact = { cta: true, icon: '🛂', label: SET_COUNTRY_CTA };
  else if (dest) {
    const result = visa.requirement(homeIso2, dest);
    if (result) {
      const meta = getVisaRequirementMeta(result.category, result.days);
      visaFact = { cta: false, icon: meta.icon, label: meta.label };
    }
  }

  const currency = dest ? info.currencyInfo(dest) : null;
  const plug = dest ? info.plugInfo(dest, homeIso2) : null;
  return {
    visa: visaFact,
    currency: currency ? { icon: '🪙', label: formatCurrencyLabel(currency.name, currency.symbol) } : null,
    plug: plug
      ? { icon: plug.adapterNeeded === true ? '🔌⚠️' : '🔌', label: formatPlugLabel(plug.plugTypes, plug.voltages, plug.adapterNeeded) }
      : null,
  };
}

function countryDisplayName(city: City, locale: AppLocale): string {
  const iso2 = countryCodeFromFlagEmoji(city.flag);
  try {
    return (iso2 && new Intl.DisplayNames([locale], { type: 'region' }).of(iso2.toUpperCase())) || city.country;
  } catch {
    return city.country;
  }
}

/** One DestinationFacts per distinct destination country, in stop order. Time difference vs Chile, like the city guides. */
export function buildDestinationFacts(
  stops: TripStop[], homeIso2: string | null, visa: VisaRequirementService, info: TravelInfoService,
  locale: AppLocale = 'es-CL', now = new Date(),
): DestinationFacts[] {
  const byCountry = new Map<string, DestinationFacts>();
  for (const stop of stops) {
    const city = WORLD_CITIES.find(c => c.id === stop.cityId);
    if (!city) continue;
    const key = countryCodeFromFlagEmoji(city.flag) ?? city.country;
    let entry = byCountry.get(key);
    if (!entry) {
      const f = cityFacts(city, homeIso2, visa, info);
      entry = { country: countryDisplayName(city, locale), flag: city.flag, cities: [] };
      if (f.visa) entry.visa = f.visa.label;
      if (f.currency) entry.currency = f.currency.label;
      if (f.plug) entry.plug = f.plug.label;
      byCountry.set(key, entry);
    }
    if (entry.cities.some(c => c.name === city.name)) continue;
    const tz = guideByCityId(city.id)?.timeZone;
    entry.cities.push(tz ? { name: city.name, timeDiff: timeDifferenceLabel(hoursAheadOf(HOME_TIME_ZONE, tz, now)) } : { name: city.name });
  }
  return [...byCountry.values()];
}
