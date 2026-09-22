import type { Attraction } from '../../core/models/comment.model';
import type { AttractionCategory } from '../../core/models/attraction-category';
import { getAllCategories } from '../../core/models/attraction-category';
import type { City } from '../../core/models/city.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { CITY_GUIDES, CityGuideEntry } from '../../data/city-guides.data';
import { isGuideAttraction, pickTopSights } from '../../core/seo/city-guide-seo.util';
import { evaluateGuideQuality, GuideQuality } from '../../core/seo/guide-quality.util';
import { MUST_SEE_RATING_THRESHOLD } from '../../core/utils/must-see.util';
import type { GuideFacts } from './guide-facts';

export type { GuideFacts } from './guide-facts';

export interface GuideSection { category: AttractionCategory; label: string; items: Attraction[]; }

export interface CityGuideModel {
  entry: CityGuideEntry;
  city: City;
  sightCount: number;
  mustSee: Attraction[];
  sections: GuideSection[];
  dayTrips: Attraction[];
  facts: GuideFacts;
  related: CityGuideEntry[];
  quality: GuideQuality;
  indexable: boolean;
}

const SECTION_ORDER: AttractionCategory[] = ['poi', 'foodie'];
const byRatingThenName = (a: Attraction, b: Attraction) => b.rating - a.rating || a.name.localeCompare(b.name);

export function buildCityGuide(entry: CityGuideEntry, city: City, attractions: Attraction[], facts: GuideFacts): CityGuideModel {
  const list = attractions.filter(isGuideAttraction);
  const quality = evaluateGuideQuality(list);

  const top = pickTopSights(list, 12);
  const strong = top.filter(a => a.rating >= MUST_SEE_RATING_THRESHOLD);
  const mustSee = strong.length >= 6 ? strong : top.slice(0, 6);
  const used = new Set(mustSee.map(a => a.id));

  const rest = list.filter(a => !a.dayTrip && !used.has(a.id)).sort(byRatingThenName);
  const sections = SECTION_ORDER
    .map(category => ({
      category,
      label: getAllCategories().find(c => c.code === category)?.label ?? category,
      items: rest.filter(a => a.category === category),
    }))
    .filter(s => s.items.length > 0);

  const country = city.country;
  const related = CITY_GUIDES
    .filter(g => g.cityId !== entry.cityId)
    .sort((a, b) => Number(sameCountry(b, country)) - Number(sameCountry(a, country)))
    .slice(0, 4);

  return {
    entry, city, sightCount: list.length, mustSee, sections,
    dayTrips: list.filter(a => a.dayTrip).sort(byRatingThenName),
    facts, related, quality, indexable: entry.reviewed && quality.ok,
  };
}

function sameCountry(g: CityGuideEntry, country: string): boolean {
  return WORLD_CITIES.find(c => c.id === g.cityId)?.country === country;
}
