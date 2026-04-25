export type Region = 'europe' | 'asia' | 'americas' | 'africa' | 'oceania';

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
  americas: $localize`:@@region.americas:América`,
  africa: $localize`:@@region.africa:África`,
  oceania: $localize`:@@region.oceania:Oceanía`,
};
