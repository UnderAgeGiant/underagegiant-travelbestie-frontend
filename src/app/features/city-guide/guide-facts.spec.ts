import { computeGuideFacts } from './guide-facts';
import type { City } from '../../core/models/city.model';
import type { CityGuideEntry } from '../../data/city-guides.data';

const city: City = { id: 'madrid', name: 'Madrid', country: 'Spain', flag: '🇪🇸', region: 'europe' };
const entry = { timeZone: 'Europe/Madrid' } as CityGuideEntry;
const JUL = new Date(Date.UTC(2026, 6, 1, 12));

describe('computeGuideFacts (home = Chile)', () => {
  it('asks the visa and travel-info services with home=CL and dest from the flag', () => {
    const visa = { requirement: jest.fn().mockReturnValue({ raw: '90', category: 'visa_free_days', days: 90 }) };
    const travelInfo = {
      currencyInfo: jest.fn().mockReturnValue({ code: 'EUR', name: 'Euro', symbol: '€' }),
      plugInfo: jest.fn().mockReturnValue({ plugTypes: ['C', 'F'], voltages: [230], frequencies: [50], adapterNeeded: false }),
    };
    const f = computeGuideFacts(city, entry, JUL, { visa: visa as any, travelInfo: travelInfo as any });
    // countryCodeFromFlagEmoji returns lowercase (flagcdn.com convention); both real services
    // .toUpperCase() internally, same as the established city-info-badge.component.ts call pattern.
    expect(visa.requirement).toHaveBeenCalledWith('CL', 'es');
    expect(travelInfo.plugInfo).toHaveBeenCalledWith('es', 'CL');
    expect(f.visa?.label).toContain('90');
    expect(f.currency).toContain('€');
    expect(f.plug).toContain('C');
    expect(f.timeDifference).toBe('6 h más que en Chile');
  });

  it('degrades to nulls when the datasets have no answer', () => {
    const visa = { requirement: () => null };
    const travelInfo = { currencyInfo: () => null, plugInfo: () => null };
    const f = computeGuideFacts(city, entry, JUL, { visa: visa as any, travelInfo: travelInfo as any });
    expect(f.visa).toBeNull();
    expect(f.currency).toBeNull();
    expect(f.plug).toBeNull();
  });
});
