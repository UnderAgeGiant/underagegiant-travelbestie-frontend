export interface FeaturedTrip {
  id:         string;
  tripName:   string;
  ownerName:  string;
  ownerEmail: string;
  createdAt:  string;
  stops:      { cityId: string; checkIn: string; checkOut: string; selectedAttractions: { attractionId?: string; activityType?: string; title?: string }[] }[];  // personal entries (Feature 71) carry activityType instead
  transits:   unknown[];
  planId:     string;
}

export interface AppStats {
  cities: number;
  users:  number;
  plans:  number;
}
