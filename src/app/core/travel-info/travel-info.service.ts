import { Injectable } from '@angular/core';
import { TRAVEL_INFO } from '../../data/travel-info.data';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface PlugInfo {
  plugTypes: string[];
  voltages: string[];
  frequencies: string[];
  adapterNeeded: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class TravelInfoService {
  currencyInfo(destIso2: string): CurrencyInfo | null {
    const entry = TRAVEL_INFO[destIso2.toUpperCase()];
    if (!entry?.currencyCode || !entry.currencyName || !entry.currencySymbol) return null;
    return { code: entry.currencyCode, name: entry.currencyName, symbol: entry.currencySymbol };
  }

  plugInfo(destIso2: string, homeIso2?: string | null): PlugInfo | null {
    const dest = TRAVEL_INFO[destIso2.toUpperCase()];
    if (!dest || dest.plugTypes.length === 0) return null;

    let adapterNeeded: boolean | null = null;
    if (homeIso2) {
      const home = TRAVEL_INFO[homeIso2.toUpperCase()];
      if (home && home.plugTypes.length > 0) {
        adapterNeeded = !dest.plugTypes.some(t => home.plugTypes.includes(t));
      }
    }

    return { plugTypes: dest.plugTypes, voltages: dest.voltages, frequencies: dest.frequencies, adapterNeeded };
  }
}
