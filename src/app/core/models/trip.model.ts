import { AttractionCategory } from '../models/attraction-category';

export interface PlannedAttraction {
  entryId:      string;
  attractionId: string;
  startTime:    string | null;
  endTime:      string | null;
  date?:        string;
  category?:    AttractionCategory;
}

export interface Lodging {
  name: string;
  url:  string;
}

export interface TripStop {
  stopId:  string;  // UUID — unique per stop instance (allows same city multiple times)
  cityId:  string;
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
  transits?: TransitLeg[];
  ownerId?: string;
  createdAt?: string;
  shareId?: string;
  itineraryExportedAt?: string;
}

export interface FavoritedTrip {
  shareId:         string;
  tripId?:         string;
  tripName:        string;
  ownerName:       string;
  stops:           TripStop[];
  transits:        TransitLeg[];
  favoriteCount?:  number;
  isFavoritedByMe?: boolean;
  favoritedAt:     string;
}
