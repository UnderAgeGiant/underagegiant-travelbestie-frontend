import { buildTravelDocsSummary } from './travel-docs-summary.util';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { TripStop } from '../models/trip.model';
import { City } from '../models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };
const ALGIERS: City = { id: 'algiers', name: 'Algiers', country: 'Algeria', flag: '🇩🇿', region: 'africa' };

function cityLookup(cityId: string): City | null {
  return { paris: PARIS, algiers: ALGIERS }[cityId] ?? null;
}

const STOPS: TripStop[] = [
  { stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '05/06/2026', selectedAttractions: [] },
  { stopId: 's2', cityId: 'algiers', checkIn: '06/06/2026', checkOut: '10/06/2026', selectedAttractions: [] },
];

describe('buildTravelDocsSummary', () => {
  const visaService = new VisaRequirementService();
  const travelInfo = new TravelInfoService();

  it('lists only the stops that actually need visa action (CL -> FR visa-free, CL -> DZ needs visa)', () => {
    const summary = buildTravelDocsSummary(STOPS, 'CL', cityLookup, visaService, travelInfo);
    expect(summary.visaStops).not.toContain('Paris');
    expect(summary.visaStops).toContain('Algiers');
  });

  it('lists every distinct currency across all stops', () => {
    const summary = buildTravelDocsSummary(STOPS, 'CL', cityLookup, visaService, travelInfo);
    expect(summary.currencies.some(c => c.includes('€'))).toBe(true);
    expect(summary.currencies.some(c => c.toLowerCase().includes('dinar'))).toBe(true);
  });

  it('lists stops needing a plug adapter relative to the home country', () => {
    const summary = buildTravelDocsSummary(STOPS, 'US', cityLookup, visaService, travelInfo);
    expect(summary.adapterStops.length).toBeGreaterThan(0);
  });

  it('returns empty arrays for visa/adapter (but still fills currencies) when no home country is set', () => {
    const summary = buildTravelDocsSummary(STOPS, null, cityLookup, visaService, travelInfo);
    expect(summary.visaStops).toEqual([]);
    expect(summary.adapterStops).toEqual([]);
    expect(summary.currencies.length).toBeGreaterThan(0);
  });

  it('returns all-empty arrays for an empty trip', () => {
    const summary = buildTravelDocsSummary([], 'CL', cityLookup, visaService, travelInfo);
    expect(summary).toEqual({ visaStops: [], currencies: [], adapterStops: [] });
  });
});
