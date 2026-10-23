import { AttractionCategory } from '../models/attraction-category';

export interface PlannedAttraction {
  entryId:      string;
  attractionId?: string;          // absent on personal activities (Feature 71)
  activityType?: string;          // personal activity type — see core/models/personal-activity.model.ts
  title?:        string;          // personal only (required there)
  mapsUrl?:      string;          // personal only
  isPrivate?:    boolean;         // personal only — hidden from public views
  startTime:    string | null;
  endTime:      string | null;
  date?:        string;
  category?:    AttractionCategory;
  ticketPurchased?: boolean;
}

export interface PersonalActivityInput {
  title: string;
  mapsUrl?: string;
  isPrivate: boolean;
  startTime: string;
  date?: string;
}

export interface Lodging {
  name: string;
  url:  string;
  address?: string;
  notes?:   string;
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
  carrier?:        string;
  locationUrl?:    string;
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
  isCollaborator?: boolean;
  ownerName?: string;
  ownerEmail?: string;
  /** Write-only — set on POST /trips when this trip was created by saving an AI-generated
   *  plan; never returned by any trip response shape, only consumed server-side by
   *  GET /karma/events' target resolution (see Task 6/7 of the karma events history plan). */
  sourceAiPlanRequestId?: string;
  /** Write-only, same rationale as sourceAiPlanRequestId — set on POST /trips when this
   *  trip's originating AI-planning session (any of its /ai/suggest calls) should be
   *  linkable from an ai_suggest karma event once this trip is saved. */
  sourcePlanSessionId?: string;
  costSettings?: CostSettings;
  costEstimate?: CostEstimate | null;
}

export interface Collaborator {
  userId:     string;
  name:       string;
  email:      string;
  invitedAt:  string;
  acceptedAt: string | null;
}

export interface PendingCollaboratorInvite {
  tripId:    string;
  tripTitle: string;
  ownerName: string;
  invitedAt: string;
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

// ── Trip cost estimate (Feature 74, contracts §18) ──────────────────────────

export type ComfortLevel = 'budget' | 'mid' | 'luxury';

export interface Place {
  geonameId:   number;
  name:        string;
  countryCode: string;
  iata:        string;   // /^[A-Z]{3}$/
}

/** adults 1–20, children 0–20 */
export interface CostSettings {
  origin:   Place | null;
  adults:   number;
  children: number;
  comfort:  ComfortLevel;
}

export const DEFAULT_COST_SETTINGS: CostSettings = { origin: null, adults: 1, children: 0, comfort: 'mid' };

/** from/to: catalog cityId or '__home__' */
export interface UnestimatedLeg {
  from: string;
  to:   string;
  mode: string;
}

export interface CostEstimate {
  totalUsd:  number;   // sum of the four lines, rounded to whole USD
  flightsUsd: number;
  lodgingUsd: number;
  ticketsUsd: number;
  groundUsd:  number;
  nights: number;
  rooms:  number;      // rooms = beds when comfort = 'budget'
  ticketCount: number;
  unpricedTicketCount: number;
  unestimated: UnestimatedLeg[];   // legs excluded from the total
  missingOrigin: boolean;          // no origin → home flights not included
  settings: CostSettings;          // what this snapshot was computed for
  inputsHash: string;
  calculatedAt: string;            // ISO
  stale?: boolean;                 // computed on read: true when inputsHash ≠ the trip's current hash
}

/** GET /fx/rates — rates are units of currency per 1 USD */
export interface FxRates {
  base:      string;
  rates:     Record<string, number>;
  fetchedAt: string | null;
}
