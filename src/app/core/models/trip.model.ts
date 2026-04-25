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
