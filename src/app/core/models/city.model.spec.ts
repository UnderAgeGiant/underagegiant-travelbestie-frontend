import { REGION_LABELS, continentOf, CONTINENT_LABELS } from './city.model';
import { CITY_IDS_WITH_ATTRACTIONS } from '../../data/cities-with-attractions.data';

describe('continent grouping (F79)', () => {
  it('maps every Asian sub-region to asia', () => {
    expect(continentOf('middle-east')).toBe('asia');
    expect(continentOf('southeast-asia')).toBe('asia');
    expect(continentOf('europe')).toBe('europe');
  });
  it('labels continents in Spanish', () => {
    expect(CONTINENT_LABELS.europe).toBe('Europa');
    expect(CONTINENT_LABELS.americas).toBe('América');
  });
  it('CITY_IDS_WITH_ATTRACTIONS has paris and more than 100 entries', () => {
    expect(CITY_IDS_WITH_ATTRACTIONS.has('paris')).toBe(true);
    expect(CITY_IDS_WITH_ATTRACTIONS.size).toBeGreaterThan(100);
  });
});

describe('REGION_LABELS', () => {
  it('has a label for every region', () => {
    expect(REGION_LABELS['europe']).toBe('Europa');
    expect(REGION_LABELS['asia']).toBe('Asia');
    expect(REGION_LABELS['southeast-asia']).toBe('Sudeste Asiático');
    expect(REGION_LABELS['east-asia']).toBe('Asia Oriental');
    expect(REGION_LABELS['south-asia']).toBe('Asia del Sur');
    expect(REGION_LABELS['central-asia']).toBe('Asia Central');
    expect(REGION_LABELS['middle-east']).toBe('Medio Oriente');
    expect(REGION_LABELS['americas']).toBe('América');
    expect(REGION_LABELS['africa']).toBe('África');
    expect(REGION_LABELS['oceania']).toBe('Oceanía');
  });
});
