export interface FeaturedTrip {
  id:         string;
  tripName:   string;
  ownerName:  string;
  ownerEmail: string;
  createdAt:  string;
  stops:      { cityId: string; checkIn: string; checkOut: string; selectedAttractions: { attractionId: string }[] }[];
  transits:   unknown[];
  planId:     string;
}

export interface AppStats {
  cities: number;
  users:  number;
  plans:  number;
}
