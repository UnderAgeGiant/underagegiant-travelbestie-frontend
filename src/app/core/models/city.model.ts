export type Region =
  | 'europe'
  | 'asia'
  | 'southeast-asia'
  | 'east-asia'
  | 'south-asia'
  | 'central-asia'
  | 'middle-east'
  | 'americas'
  | 'africa'
  | 'oceania';

export interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: Region;
}

export const REGION_LABELS: Record<Region, string> = {
  europe: $localize`:@@region.europe:Europa`,
  asia: $localize`:@@region.asia:Asia`,
  'southeast-asia': $localize`:@@region.southeast-asia:Sudeste Asiático`,
  'east-asia': $localize`:@@region.east-asia:Asia Oriental`,
  'south-asia': $localize`:@@region.south-asia:Asia del Sur`,
  'central-asia': $localize`:@@region.central-asia:Asia Central`,
  'middle-east': $localize`:@@region.middle-east:Medio Oriente`,
  americas: $localize`:@@region.americas:América`,
  africa: $localize`:@@region.africa:África`,
  oceania: $localize`:@@region.oceania:Oceanía`,
};

/** Continent grouping for the multi-city picker (F79): every Asian sub-region folds into asia. */
export type Continent = 'europe' | 'asia' | 'americas' | 'africa' | 'oceania';

export function continentOf(region: Region): Continent {
  switch (region) {
    case 'europe':   return 'europe';
    case 'americas': return 'americas';
    case 'africa':   return 'africa';
    case 'oceania':  return 'oceania';
    default:         return 'asia';
  }
}

export const CONTINENT_LABELS: Record<Continent, string> = {
  europe:   $localize`:@@continent.europe:Europa`,
  asia:     $localize`:@@continent.asia:Asia`,
  americas: $localize`:@@continent.americas:América`,
  africa:   $localize`:@@continent.africa:África`,
  oceania:  $localize`:@@continent.oceania:Oceanía`,
};
