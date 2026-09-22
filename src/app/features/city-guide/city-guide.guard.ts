import { CanMatchFn } from '@angular/router';
import { guideBySlug } from '../../data/city-guides.data';

/** `ciudad/:slug` only matches manifest slugs; anything else falls through to the wildcard NotFound route. */
export const cityGuideSlugGuard: CanMatchFn = (_route, segments) => {
  const slug = segments[1]?.path;
  return !!slug && !!guideBySlug(slug);
};
