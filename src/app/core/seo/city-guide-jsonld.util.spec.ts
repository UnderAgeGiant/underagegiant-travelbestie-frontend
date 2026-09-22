import { cityGuideJsonLd } from './city-guide-jsonld.util';

const input = {
  siteUrl: 'https://tripilove.com/', slug: 'madrid', displayName: 'Madrid', country: 'Spain',
  description: 'Guía de Madrid.',
  sights: [
    { name: 'Museo del Prado', description: 'Museo.', image: 'https://upload.wikimedia.org/p.jpg', lat: 40.4138, lng: -3.6921 },
    { name: 'Templo de Debod' },
  ],
};

describe('cityGuideJsonLd', () => {
  const ld: any = cityGuideJsonLd(input);
  const byType = (t: string) => ld['@graph'].find((n: any) => n['@type'] === t);

  it('describes the destination with its canonical url and country', () => {
    const d = byType('TouristDestination');
    expect(d.name).toBe('Madrid');
    expect(d.url).toBe('https://tripilove.com/ciudad/madrid');
    expect(d.containedInPlace).toEqual({ '@type': 'Country', name: 'Spain' });
  });

  it('lists sights as TouristAttraction with optional geo/image', () => {
    const list = byType('TouristDestination').includesAttraction;
    expect(list).toHaveLength(2);
    expect(list[0].geo).toEqual({ '@type': 'GeoCoordinates', latitude: 40.4138, longitude: -3.6921 });
    expect(list[0].image).toBe('https://upload.wikimedia.org/p.jpg');
    expect(list[1].geo).toBeUndefined();
  });

  it('includes a two-level breadcrumb', () => {
    const items = byType('BreadcrumbList').itemListElement;
    expect(items.map((i: any) => i.name)).toEqual(['Inicio', 'Madrid']);
    expect(items[1].item).toBe('https://tripilove.com/ciudad/madrid');
  });

  it('serialises cleanly (no undefined leaks)', () => {
    expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow();
    expect(JSON.stringify(ld)).not.toContain('undefined');
  });
});
