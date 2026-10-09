import { continentForCity, GUIDE_CONTINENT_ORDER } from './guide-continent.util';

describe('continentForCity', () => {
  it.each([
    ['paris', 'europe'], ['buenosaires', 'south_america'], ['lima', 'south_america'],
    ['miami', 'north_central_america'], ['tokyo', 'asia'], ['no-such-city', null],
  ])('%s → %s', (id, expected) => expect(continentForCity(id)).toBe(expected));

  it('lists continents in the approved order', () => {
    expect(GUIDE_CONTINENT_ORDER).toEqual(['south_america', 'north_central_america', 'europe', 'asia', 'africa', 'oceania']);
  });
});
