export interface FeedPlanAttraction {
  attractionId: string;
  date?:        string;         // dd/mm/yyyy
  startTime:    string | null;  // HH:mm
  endTime:      string | null;  // HH:mm
}

export interface FeedPlanStop {
  cityId:   string;
  checkIn:  string;             // dd/mm/yyyy
  checkOut: string;             // dd/mm/yyyy
  selectedAttractions: FeedPlanAttraction[];
}

/** One plan in GET /feed. `id` is the shareId. */
export interface FeedPlan {
  id:            string;
  tripName:      string;
  ownerName:     string;
  createdAt:     string;
  favoriteCount: number;
  stops:         FeedPlanStop[];
}

export interface FeedPage {
  items:      FeedPlan[];
  nextCursor: string | null;
}
