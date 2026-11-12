import { buildItineraryExportBody, ItineraryExportDeps } from './itinerary-export.util';
import { TripStop, PlannedAttraction } from '../models/trip.model';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import * as attractionsData from '../../data/attractions.data';

const visa = new VisaRequirementService();
const deps: ItineraryExportDeps = {
  homeIso2: 'CL', siteUrl: 'https://tripilove.com',
  visa, info: new TravelInfoService(),
};
const planned = (p: Partial<PlannedAttraction>): PlannedAttraction =>
  ({ entryId: Math.random().toString(), startTime: null, endTime: null, ...p });
const stop = (cityId: string, selectedAttractions: PlannedAttraction[]): TripStop =>
  ({ stopId: cityId, cityId, checkIn: '01/12/2026', checkOut: '03/12/2026', selectedAttractions });

const lima = () => stop('lima', [
  planned({ attractionId: 'lima_12' }),
  planned({ activityType: 'lunch', title: 'Almuerzo en Barranco' }),
]);

describe('buildItineraryExportBody', () => {
  beforeAll(() => visa.load());
  afterEach(() => jest.restoreAllMocks());

  it('covers planned catalog attractions only, with details, personal labels and destinations', () => {
    const body = buildItineraryExportBody([lima()], 'es-CL', deps);
    expect(Object.keys(body.attractionNames!)).toEqual(['lima_12']);
    expect(body.attractionNames!['lima_12']).toBe('Catedral de Lima');
    expect(body.attractionDurations).toEqual({ lima_12: 45 });
    expect(body.attractionDetails!['lima_12']).toMatchObject({
      website: 'https://catedraldelima.org.pe/', type: 'Iglesia', rating: 4.7,
    });
    expect(body.attractionDetails!['lima_12'].description).toMatch(/^La Basílica Catedral/);
    expect(body.personalLabels).toEqual({ lunch: 'Almuerzo' });
    expect(body.destinations![0].country).toBe('Perú');
    expect(body.cityNames).toEqual({ lima: 'Lima' });
    expect(body).toMatchObject({ locale: 'es-CL', currency: 'CLP', siteUrl: 'https://tripilove.com' });
  });

  it('uses English names and descriptions for en-US', () => {
    const body = buildItineraryExportBody([lima()], 'en-US', deps);
    expect(body.attractionNames!['lima_12']).toBe('Cathedral of Lima');
    expect(body.attractionDetails!['lima_12'].description).toMatch(/^The Cathedral Basilica/);
    expect(body.destinations![0].country).toBe('Peru');
  });

  it('cuts long text with "…", drops unsafe URLs and keeps only valid schedule days', () => {
    jest.spyOn(attractionsData, 'getAttractions').mockReturnValue([{
      id: 'lima_x', name: 'X', type: 'Museo', category: 'poi', active: true, icon: '🏛️', bg: '#fff',
      rating: 9, estimatedMinutes: 60, description: 'a'.repeat(5000),
      website: 'javascript:alert(1)', ticketUrl: `https://t.example/${'x'.repeat(600)}`,
      schedule: { mon: { open: '09:00', close: '17:00' }, tue: 'closed', wed: { open: '9am', close: '5pm' }, notes: 'n' },
    }]);
    const body = buildItineraryExportBody([stop('lima', [planned({ attractionId: 'lima_x' })])], 'es-CL', deps);
    const d = body.attractionDetails!['lima_x'];
    expect(d.description!.length).toBeLessThanOrEqual(1000);
    expect(d.description!.endsWith('…')).toBe(true);
    expect(d.website).toBeUndefined();
    expect(d.ticketUrl).toBeUndefined();
    expect(d.rating).toBeUndefined();
    expect(d.schedule).toEqual({ mon: { open: '09:00', close: '17:00' } });
    expect(body.ticketRequiredIds).toEqual(['lima_x']);
  });

  it('falls back to USD, no siteUrl and the CTA visa without a home country', () => {
    const body = buildItineraryExportBody([lima()], 'es-CL', { ...deps, homeIso2: null, siteUrl: 'SITE_URL_PLACEHOLDER' });
    expect(body.currency).toBe('USD');
    expect(body.siteUrl).toBeUndefined();
    expect(body.destinations![0].visa).toMatch(/país de residencia/);
  });

  it('skips unknown cities and de-duplicates repeated attractions', () => {
    const body = buildItineraryExportBody([stop('atlantis', []), lima(), lima()], 'es-CL', deps);
    expect(body.cityNames).toEqual({ lima: 'Lima' });
    expect(body.ticketRequiredIds).toEqual([]);
    expect(Object.keys(body.attractionDetails!)).toEqual(['lima_12']);
  });
});
