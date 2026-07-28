export interface TripSuggestion {
  id: number;
  title: string;
  summary: string;
  highlights: string[];
  cityIds?: string[];
}

export interface SuggestTripsResponse {
  options: [TripSuggestion, TripSuggestion];
}

export interface CatalogEntry { id: string; name: string; }
export type CityCatalog = Record<string, CatalogEntry[]>;

export interface PlanSessionOptions {
  selectedOptionTitle:      string;
  selectedOptionSummary:    string;
  selectedOptionHighlights: string[];
  preferences:              string;
  duration:                 number;  // 0 when not specified
  budget:                   string;  // '' when not specified
  startDate:                string;  // '' when not specified
}

export interface PlanChangeInfo {
  type:                 'new_session' | 'free_change' | 'charged_change';
  freeChangesUsed:      number;
  freeChangesRemaining: number;
  reason?:              'major_change' | 'limit_reached';
}

export interface PlanTripRequest {
  selectedOption: TripSuggestion;
  preferences:    string;
  duration?:      number;
  budget?:        string;
  startDate?:     string;
  cityCatalog?:   CityCatalog;
  planSessionId?: string;   // ← ties multiple /ai/plan calls into one session
}

/** Shape of the /ai/plan HTTP response (plan data + optional change info). */
export interface PlanTripResponse {
  title:      string;
  stops:      unknown[];    // matches Trip.stops shape; component casts to Trip
  transits:   unknown[];
  changeInfo?: PlanChangeInfo;
}
