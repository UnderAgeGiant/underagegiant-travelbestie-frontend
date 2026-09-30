import { buildItineraryExportMaps } from './itinerary-export.util';

jest.mock('../../data/attractions.data', () => ({
  getAttractions: () => [{
    id: 'x_0', name: 'Ciudad Prohibida', nameEn: 'Forbidden City', type: 'Histórico', category: 'poi',
    active: true, icon: '🏛️', bg: '#fff', rating: 4.5, estimatedMinutes: 60,
  }],
}));

const stop = { stopId: 's1', cityId: 'paris', checkIn: '01/01/2027', checkOut: '02/01/2027', selectedAttractions: [] } as any;

describe('buildItineraryExportMaps locale', () => {
  it('defaults to Spanish names', () => {
    expect(buildItineraryExportMaps([stop]).attractionNames).toEqual({ x_0: 'Ciudad Prohibida' });
  });
  it('uses English names for en-US', () => {
    expect(buildItineraryExportMaps([stop], 'en-US').attractionNames).toEqual({ x_0: 'Forbidden City' });
  });
});
