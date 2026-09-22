import { guideDescription, guidePath, guideTitle, isGuideAttraction, pickTopSights, GuideSight } from './city-guide-seo.util';
import { CITY_GUIDES } from '../../data/city-guides.data';

describe('isGuideAttraction', () => {
  it('counts active pois/foodies only — not inactive entries, dated events or freetours', () => {
    expect(isGuideAttraction({ active: true, category: 'poi' })).toBe(true);
    expect(isGuideAttraction({ active: true, category: 'foodie' })).toBe(true);
    expect(isGuideAttraction({ active: false, category: 'poi' })).toBe(false);
    expect(isGuideAttraction({ active: true, category: 'event_party' })).toBe(false);
    expect(isGuideAttraction({ active: true, category: 'freetour' })).toBe(false);
  });
});

describe('guideTitle / guideDescription', () => {
  it('uses the full "desde Chile" title when it fits in 60 chars', () => {
    expect(guideTitle('Madrid')).toBe('Qué hacer en Madrid: guía de viaje desde Chile | Tripilove');
  });

  it('falls back to a shorter title for long city names', () => {
    expect(guideTitle('Buenos Aires')).toBe('Qué hacer en Buenos Aires: guía de viaje | Tripilove');
    expect(guideTitle('Río de Janeiro').length).toBeLessThanOrEqual(60);
  });

  it('keeps every manifest title ≤ 60 and description ≤ 155 chars', () => {
    for (const g of CITY_GUIDES) {
      expect(guideTitle(g.displayName).length).toBeLessThanOrEqual(60);
      expect(guideDescription(g.displayName, 48).length).toBeLessThanOrEqual(155);
    }
  });

  it('description mentions the city and the sight count', () => {
    const d = guideDescription('Madrid', 42);
    expect(d).toContain('Madrid');
    expect(d).toContain('42');
  });

  it('guidePath', () => expect(guidePath('buenos-aires')).toBe('/ciudad/buenos-aires'));
});

describe('pickTopSights', () => {
  const s = (name: string, rating: number, o: Partial<GuideSight> = {}): GuideSight =>
    ({ active: true, name, rating, description: 'texto', ...o });

  it('keeps active, described, non-day-trip sights sorted by rating desc then name', () => {
    const list = [s('B', 4.5), s('A', 4.5), s('C', 4.9), s('X', 5, { active: false }), s('Y', 5, { dayTrip: true }), s('Z', 5, { description: '' })];
    expect(pickTopSights(list, 10).map(x => x.name)).toEqual(['C', 'A', 'B']);
    expect(pickTopSights(list, 2).map(x => x.name)).toEqual(['C', 'A']);
  });
});
