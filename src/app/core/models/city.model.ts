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
