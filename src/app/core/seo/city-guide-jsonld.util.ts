// IMPORT-FREE on purpose (see guide-quality.util.ts).
export interface GuideJsonLdInput {
  siteUrl: string;
  slug: string;
  displayName: string;
  country: string;
  description: string;
  sights: { name: string; description?: string; image?: string; lat?: number; lng?: number }[];
}

export function cityGuideJsonLd(i: GuideJsonLdInput): object {
  const origin = i.siteUrl.replace(/\/+$/, '');
  const url = `${origin}/ciudad/${i.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        '@id': `${url}#destination`,
        name: i.displayName,
        description: i.description,
        url,
        containedInPlace: { '@type': 'Country', name: i.country },
        includesAttraction: i.sights.map(s => ({
          '@type': 'TouristAttraction',
          name: s.name,
          description: s.description,
          image: s.image,
          geo: s.lat != null && s.lng != null
            ? { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng }
            : undefined,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: i.displayName, item: url },
        ],
      },
    ],
  };
}
