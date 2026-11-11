import { buildDestinationFacts, cityFacts, SET_COUNTRY_CTA } from './destination-facts.util';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { TripStop } from '../models/trip.model';
import { WORLD_CITIES } from '../../data/cities.data';

const visa = new VisaRequirementService();
const info = new TravelInfoService();
const stop = (cityId: string): TripStop =>
  ({ stopId: cityId, cityId, checkIn: '01/12/2026', checkOut: '03/12/2026', selectedAttractions: [] });
const LIMA = WORLD_CITIES.find(c => c.id === 'lima')!;

describe('destination facts', () => {
  it('groups Lima + Cusco into one Peru entry with the badge labels', () => {
    const facts = buildDestinationFacts([stop('lima'), stop('cusco'), stop('lima')], 'CL', visa, info);
    const badge = cityFacts(LIMA, 'CL', visa, info);
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      country: 'Perú', flag: '🇵🇪',
      visa: badge.visa!.label, currency: badge.currency!.label, plug: badge.plug!.label,
    });
    expect(facts[0].cities.map(c => c.name)).toEqual(['Lima', 'Cusco']);
    expect(facts[0].cities[0].timeDiff).toMatch(/Chile/); // both are guide cities with a timeZone
  });

  it('measures the time difference against Chile, not the device timezone', () => {
    // 1 Dec 2026: Santiago UTC-3 (DST), Lima UTC-5 → 2 h behind, whatever TZ the test machine runs in.
    const facts = buildDestinationFacts([stop('lima')], 'CL', visa, info, 'es-CL', new Date('2026-12-01T12:00:00Z'));
    expect(facts[0].cities[0].timeDiff).toBe('2 h menos que en Chile');
  });

  it('uses the set-country CTA as visa when home is unknown', () => {
    expect(buildDestinationFacts([stop('lima')], null, visa, info)[0].visa).toBe(SET_COUNTRY_CTA);
    expect(cityFacts(LIMA, null, visa, info).visa).toEqual({ cta: true, icon: '🛂', label: SET_COUNTRY_CTA });
  });

  it('names the country in English for en-US and skips unknown cities', () => {
    const facts = buildDestinationFacts([stop('nope'), stop('lima')], 'CL', visa, info, 'en-US');
    expect(facts.map(f => f.country)).toEqual(['Peru']);
  });

  it('omits timeDiff for a non-guide city', () => {
    const nonGuide = WORLD_CITIES.find(c => c.id === 'arequipa');
    if (!nonGuide) return;
    expect(buildDestinationFacts([stop('arequipa')], 'CL', visa, info)[0].cities[0].timeDiff).toBeUndefined();
  });
});
