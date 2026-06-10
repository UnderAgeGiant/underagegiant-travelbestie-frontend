import { getAttractions } from './attractions.data';
import { City } from '../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };
const UNKNOWN: City = { id: 'oz', name: 'Emerald City', country: 'Oz', flag: '🌈', region: 'europe' };

describe('getAttractions', () => {
  it('returns curated attractions for paris with correct ids', () => {
    const attractions = getAttractions(PARIS);
    expect(attractions.length).toBeGreaterThan(0);
    expect(attractions[0].id).toBe('paris_0');
    expect(attractions.some(a => a.name === 'Eiffel Tower')).toBe(true);
  });

  it('returns 5 template attractions for unknown city', () => {
    const attractions = getAttractions(UNKNOWN);
    expect(attractions.length).toBe(5);
    expect(attractions[0].id).toBe('oz_0');
    expect(attractions[0].name).toContain('Emerald City');
  });

  it('all template attractions have rating between 4.0 and 5.0', () => {
    const attractions = getAttractions(UNKNOWN);
    for (const a of attractions) {
      expect(a.rating).toBeGreaterThanOrEqual(4.0);
      expect(a.rating).toBeLessThanOrEqual(5.0);
    }
  });
});
