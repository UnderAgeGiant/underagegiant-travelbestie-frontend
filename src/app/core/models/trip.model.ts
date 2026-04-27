export interface PlannedAttraction {
  attractionId: string;
  startTime: string; // "HH:mm"
}

export interface Lodging {
  name: string;
  url:  string;
}

export interface TripStop {
  cityId: string;
  checkIn: string;
  checkOut: string;
  selectedAttractions: PlannedAttraction[];
  lodging?: Lodging;
}

export type TransitMode = 'flight' | 'train' | 'boat' | 'bus' | 'car';

export interface TransitSegment {
  mode:            TransitMode;
  durationMinutes: number;
  notes:           string;
}

export interface TransitLeg {
  fromCityId: string;
  toCityId:   string;
  segments:   TransitSegment[];
  date?:      string; // dd/mm/yyyy — departure date set by the user
}

export interface Planification {
  stops: TripStop[];
  totalAttractions: number;
}

export interface Trip {
  id?: string;
  title: string;
  stops: TripStop[];
  ownerId?: string;
  createdAt?: string;
}
