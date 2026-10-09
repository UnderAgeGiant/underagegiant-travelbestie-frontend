import { WORLD_CITIES } from '../../data/cities.data';

export type GuideContinent = 'south_america' | 'north_central_america' | 'europe' | 'asia' | 'africa' | 'oceania';

export const GUIDE_CONTINENT_ORDER: GuideContinent[] = ['south_america', 'north_central_america', 'europe', 'asia', 'africa', 'oceania'];

/** `region: 'americas'` is one bucket in WORLD_CITIES; split it by country. */
const SOUTH_AMERICA = new Set(['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela', 'French Guiana']);
const ASIA_REGIONS = new Set(['asia', 'central-asia', 'east-asia', 'south-asia', 'southeast-asia', 'middle-east']);

export function continentForCity(cityId: string): GuideContinent | null {
  const city = WORLD_CITIES.find(c => c.id === cityId);
  if (!city) return null;
  const region = (city as { region?: string }).region;
  if (region === 'americas') return SOUTH_AMERICA.has(city.country) ? 'south_america' : 'north_central_america';
  if (region === 'europe') return 'europe';
  if (region === 'africa') return 'africa';
  if (region === 'oceania') return 'oceania';
  if (region && ASIA_REGIONS.has(region)) return 'asia';
  return null;
}

export function guideContinentLabel(c: GuideContinent): string {
  switch (c) {
    case 'south_america':         return $localize`:@@guides.continent.southAmerica:Sudamérica`;
    case 'north_central_america': return $localize`:@@guides.continent.northCentralAmerica:Norte y Centroamérica`;
    case 'europe':                return $localize`:@@guides.continent.europe:Europa`;
    case 'asia':                  return $localize`:@@guides.continent.asia:Asia`;
    case 'africa':                return $localize`:@@guides.continent.africa:África`;
    case 'oceania':               return $localize`:@@guides.continent.oceania:Oceanía`;
  }
}
