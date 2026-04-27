export interface PlannedAttraction {
  attractionId: string;
  startTime: string; // "HH:mm"
}

export interface TripStop {
  cityId: string;
  checkIn: string;
  checkOut: string;
  selectedAttractions: PlannedAttraction[];
}

export type TransitMode = 'flight' | 'train' | 'boat' | 'bus' | 'car';

export interface TransitLeg {
  fromCityId:      string;
  toCityId:        string;
  mode:            TransitMode;
  durationMinutes: number;
  notes:           string;
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
