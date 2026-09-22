import { guideSeoPage } from './guide-seo-page';
import type { CityGuideModel } from './city-guide.model';
import type { Attraction } from '../../core/models/comment.model';

const model = (over: Partial<CityGuideModel> = {}) => ({
  entry: { slug: 'madrid', displayName: 'Madrid' },
  city: { country: 'Spain' },
  sightCount: 42,
  indexable: true,
  ...over,
}) as CityGuideModel;

const sight = { name: 'Museo del Prado', description: 'Museo.', imageUrl: 'https://x/p.jpg', lat: 40.41, lng: -3.69 } as Attraction;

describe('guideSeoPage', () => {
  it('title/description/path from the shared utils, JSON-LD with the top sights', () => {
    const p = guideSeoPage(model(), 'https://tripilove.com', [sight]);
    expect(p.title).toBe('Qué hacer en Madrid: guía de viaje desde Chile | Tripilove');
    expect(p.description).toContain('42');
    expect(p.path).toBe('/ciudad/madrid');
    expect(p.noindex).toBe(false);
    const ld: any = p.jsonLd;
    expect(ld['@graph'][0].includesAttraction[0].name).toBe('Museo del Prado');
  });

  it('noindex when the guide is not indexable (unreviewed or below the data floor)', () => {
    expect(guideSeoPage(model({ indexable: false }), 'https://tripilove.com', []).noindex).toBe(true);
  });
});
