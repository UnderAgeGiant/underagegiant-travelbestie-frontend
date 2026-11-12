import { CITY_GUIDES } from './city-guides.data';
import { GUIDE_TOP_PHOTOS } from './guide-photos.data';
import { WORLD_CITIES } from './cities.data';
import { getAttractions } from './attractions.data';
import { isGuideAttraction, pickTopSights } from '../core/seo/city-guide-seo.util';

describe('GUIDE_TOP_PHOTOS', () => {
  it.each(CITY_GUIDES.map(g => [g.cityId]))(
    'matches the top sight photo for %s (run `npm run data` and commit guide-photos.data.ts)',
    cityId => {
      const city = WORLD_CITIES.find(c => c.id === cityId);
      expect(city).toBeDefined();
      const expected = pickTopSights(getAttractions(city!).filter(isGuideAttraction), 8).find(s => s.imageUrl)?.imageUrl;
      expect(GUIDE_TOP_PHOTOS[cityId]).toBe(expected);
    },
  );
});
