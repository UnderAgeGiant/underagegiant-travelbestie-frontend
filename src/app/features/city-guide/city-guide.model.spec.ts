import { buildCityGuide, GuideFacts } from './city-guide.model';
import { CityGuideEntry } from '../../data/city-guides.data';
import type { Attraction } from '../../core/models/comment.model';
import type { City } from '../../core/models/city.model';

const city: City = { id: 'madrid', name: 'Madrid', country: 'Spain', flag: '🇪🇸', region: 'europe' };
const entry: CityGuideEntry = {
  slug: 'madrid', cityId: 'madrid', displayName: 'Madrid', wave: 1, timeZone: 'Europe/Madrid', reviewed: true,
  intro: 'x'.repeat(90), bestTime: 'b', gettingThere: 'g', tips: ['a', 'b', 'c'], faq: [],
};
const facts: GuideFacts = { visa: null, currency: null, plug: null, timeDifference: '6 h más que en Chile' };

let n = 0;
const att = (o: Partial<Attraction> = {}): Attraction => ({
  id: `madrid_${n++}`, name: `A${n}`, type: 'Museo', category: 'poi', active: true, icon: '🖼️', bg: '#fff',
  rating: 4.2, estimatedMinutes: 60, imageUrl: 'https://x/y.jpg', description: 'd'.repeat(70), ...o,
});
const many = (k: number, rating = (i: number) => 4.1 + (i % 8) / 10) =>
  Array.from({ length: k }, (_, i) => att({ rating: rating(i) }));

describe('buildCityGuide', () => {
  it('excludes events, freetours and inactive entries from everything', () => {
    const list = [...many(30), att({ category: 'event_party', rating: 4.9 }), att({ category: 'freetour', rating: 4.9 }), att({ active: false, rating: 4.9 })];
    const g = buildCityGuide(entry, city, list, facts);
    expect(g.sightCount).toBe(30);
    const all = [...g.mustSee, ...g.sections.flatMap(s => s.items), ...g.dayTrips];
    expect(all.every(a => a.category === 'poi' && a.active)).toBe(true);
  });

  it('separates day trips and never repeats a sight across sections', () => {
    const list = [...many(30), att({ dayTrip: true, name: 'Toledo', rating: 4.8 })];
    const g = buildCityGuide(entry, city, list, facts);
    expect(g.dayTrips.map(a => a.name)).toEqual(['Toledo']);
    const ids = [...g.mustSee, ...g.sections.flatMap(s => s.items)].map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some(id => g.dayTrips.some(d => d.id === id))).toBe(false);
  });

  it('mustSee = rating ≥ 4.7 (max 12) when there are at least 6, else the top 6', () => {
    const rich = buildCityGuide(entry, city, many(40, i => (i < 8 ? 4.8 : 4.2)), facts);
    expect(rich.mustSee).toHaveLength(8);
    expect(rich.mustSee.every(a => a.rating >= 4.7)).toBe(true);
    const flat = buildCityGuide(entry, city, many(40, () => 4.2), facts);
    expect(flat.mustSee).toHaveLength(6);
  });

  it('groups the remaining sights by category, best first, skipping empty groups', () => {
    const list = [...many(30), att({ category: 'foodie', type: 'Mercado', name: 'Mercado', rating: 4.5 })];
    const g = buildCityGuide(entry, city, list, facts);
    const foodie = g.sections.find(s => s.category === 'foodie');
    expect(foodie?.items.map(a => a.name)).toContain('Mercado');
    expect(g.sections.every(s => s.items.length > 0)).toBe(true);
  });

  it('indexable only when reviewed AND the data quality gate passes', () => {
    expect(buildCityGuide(entry, city, many(40), facts).indexable).toBe(true);
    expect(buildCityGuide({ ...entry, reviewed: false }, city, many(40), facts).indexable).toBe(false);
    const thin = buildCityGuide(entry, city, many(10), facts);
    expect(thin.quality.ok).toBe(false);
    expect(thin.indexable).toBe(false);
  });

  it('related guides exclude itself and are capped at 4', () => {
    const g = buildCityGuide(entry, city, many(40), facts);
    expect(g.related.every(r => r.cityId !== 'madrid')).toBe(true);
    expect(g.related.length).toBeLessThanOrEqual(4);
  });
});
