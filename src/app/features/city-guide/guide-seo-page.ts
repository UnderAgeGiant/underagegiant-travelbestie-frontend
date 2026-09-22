import type { Attraction } from '../../core/models/comment.model';
import type { SeoPage } from '../../core/seo/seo.service';
import { guideDescription, guidePath, guideTitle } from '../../core/seo/city-guide-seo.util';
import { cityGuideJsonLd } from '../../core/seo/city-guide-jsonld.util';
import type { CityGuideModel } from './city-guide.model';

export function guideSeoPage(model: CityGuideModel, siteUrl: string, topSights: Attraction[]): SeoPage {
  const { entry, city } = model;
  const description = guideDescription(entry.displayName, model.sightCount);
  return {
    title: guideTitle(entry.displayName),
    description,
    path: guidePath(entry.slug),
    noindex: !model.indexable,
    jsonLd: cityGuideJsonLd({
      siteUrl, slug: entry.slug, displayName: entry.displayName, country: city.country, description,
      sights: topSights.map(a => ({ name: a.name, description: a.description, image: a.imageUrl, lat: a.lat, lng: a.lng })),
    }),
  };
}
