export interface PlannedAttraction {
  attractionId: string;
  startTime:    string;  // "HH:mm"
  date?:        string;  // "dd/mm/yyyy" — which day within the stop
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
  departureDate:   string;  // dd/mm/yyyy
  departureTime:   string;  // HH:mm
  arrivalDate:     string;  // dd/mm/yyyy
  arrivalTime:     string;  // HH:mm
  notes:           string;
  durationMinutes?: number; // legacy — kept for backward compat with saved data
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
