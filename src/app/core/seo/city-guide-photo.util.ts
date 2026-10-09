import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { isGuideAttraction, pickTopSights } from './city-guide-seo.util';

/** Best-rated described sight's photo for a guide's city — same source the guide page uses for its "Imperdibles". */
export function guideTopPhoto(cityId: string): string | undefined {
  const city = WORLD_CITIES.find(c => c.id === cityId);
  if (!city) return undefined;
  return pickTopSights(getAttractions(city).filter(isGuideAttraction), 8).find(s => s.imageUrl)?.imageUrl;
}
