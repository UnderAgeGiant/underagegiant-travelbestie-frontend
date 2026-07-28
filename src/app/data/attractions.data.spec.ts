import { getAttractions, stripInsecureImages } from './attractions.data';
import { City } from '../core/models/city.model';
import { Attraction } from '../core/models/comment.model';

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

const BASE_ATTRACTION: Attraction = {
  id: 'x', name: 'X', type: 'Histórico', category: 'poi', active: true,
  icon: '🏛️', bg: '#E8F0FD', rating: 4.5, estimatedMinutes: 60,
};

describe('stripInsecureImages', () => {
  it('keeps an https imageUrl and https images entries', () => {
    const result = stripInsecureImages({
      ...BASE_ATTRACTION,
      imageUrl: 'https://img/a.jpg',
      images: ['https://img/b.jpg', 'https://img/c.jpg'],
    });
    expect(result.imageUrl).toBe('https://img/a.jpg');
    expect(result.images).toEqual(['https://img/b.jpg', 'https://img/c.jpg']);
  });

  it('drops an http imageUrl', () => {
    const result = stripInsecureImages({ ...BASE_ATTRACTION, imageUrl: 'http://img/a.jpg' });
    expect(result.imageUrl).toBeUndefined();
  });

  it('filters http entries out of images but keeps https ones', () => {
    const result = stripInsecureImages({
      ...BASE_ATTRACTION,
      images: ['http://img/bad.jpg', 'https://img/good.jpg'],
    });
    expect(result.images).toEqual(['https://img/good.jpg']);
  });

  it('leaves images undefined when the attraction has no images array', () => {
    const result = stripInsecureImages({ ...BASE_ATTRACTION, imageUrl: 'https://img/a.jpg' });
    expect(result.images).toBeUndefined();
  });
});
