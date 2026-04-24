export interface TripStop {
  cityId: string;
  checkIn: string;
  checkOut: string;
}

export interface Trip {
  id?: string;
  title: string;
  stops: TripStop[];
  ownerId?: string;
  createdAt?: string;
}
