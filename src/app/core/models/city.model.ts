export type Region = 'europe' | 'asia' | 'americas' | 'africa' | 'oceania';

export interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: Region;
}

export const REGION_LABELS: Record<Region, string> = {
  europe: 'Europe',
  asia: 'Asia',
  americas: 'Americas',
  africa: 'Africa',
  oceania: 'Oceania',
};
