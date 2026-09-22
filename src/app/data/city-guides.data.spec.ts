import { CITY_GUIDES, HOME_TIME_ZONE, guideByCityId, guideBySlug } from './city-guides.data';
import { WORLD_CITIES } from './cities.data';
import { getAttractions } from './attractions.data';
import { evaluateGuideQuality } from '../core/seo/guide-quality.util';
import { isGuideAttraction } from '../core/seo/city-guide-seo.util';

describe('CITY_GUIDES manifest', () => {
  it('has unique kebab-case slugs and unique city ids that exist in WORLD_CITIES', () => {
    const slugs = CITY_GUIDES.map(g => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(CITY_GUIDES.map(g => g.cityId)).size).toBe(CITY_GUIDES.length);
    for (const g of CITY_GUIDES) {
      expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(WORLD_CITIES.some(c => c.id === g.cityId)).toBe(true);
    }
  });

  it('uses valid IANA time zones and the required editorial fields', () => {
    expect(HOME_TIME_ZONE).toBe('America/Santiago');
    for (const g of CITY_GUIDES) {
      expect(() => new Intl.DateTimeFormat('es', { timeZone: g.timeZone })).not.toThrow();
      expect(g.intro.length).toBeGreaterThan(80);
      expect(g.tips.length).toBeGreaterThanOrEqual(3);
      expect(g.faq.length).toBeGreaterThanOrEqual(3);
      for (const f of g.faq) { expect(f.q.endsWith('?')).toBe(true); expect(f.a.length).toBeGreaterThan(40); }
    }
  });

  it('lookups', () => {
    expect(guideBySlug('madrid')?.cityId).toBe('madrid');
    expect(guideByCityId('madrid')?.slug).toBe('madrid');
    expect(guideBySlug('nope')).toBeUndefined();
  });

  // The launch gate: a guide may only be flagged `reviewed` if its data really is good enough to index.
  it('every reviewed guide meets the data quality floor', () => {
    for (const g of CITY_GUIDES.filter(x => x.reviewed)) {
      const city = WORLD_CITIES.find(c => c.id === g.cityId)!;
      const q = evaluateGuideQuality(getAttractions(city).filter(isGuideAttraction));
      expect({ slug: g.slug, reasons: q.reasons }).toEqual({ slug: g.slug, reasons: [] });
    }
  });
});
