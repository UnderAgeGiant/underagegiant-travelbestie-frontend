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

export interface SuggestionScheduleEntry {
  date:      string;   // dd/mm/yyyy
  startTime: string;   // HH:mm
  endTime:   string;   // HH:mm
}

export interface SuggestionDeparture {
  date: string;   // dd/mm/yyyy
  time: string;   // HH:mm
}

export interface CityAttractionSuggestion {
  attractionId: string;
  date:         string;   // dd/mm/yyyy
  startTime:    string;   // HH:mm
  endTime:      string;   // HH:mm — informational only; TripService.addAttraction recomputes the
                           // persisted endTime from the curated attraction's own estimatedMinutes
  reason:       string;
}

export interface SuggestCityAttractionsResponse {
  suggestions: CityAttractionSuggestion[];
}

export interface CompanionSuggestion {
  attractionId: string;
  date:         string;   // dd/mm/yyyy
  startTime:    string;   // HH:mm
  endTime:      string;   // HH:mm
  reason:       string;
}

/** Shared shape for both /companion/boost and /companion/status responses —
 *  secondsRemaining is 0 when boosted is false. */
export interface CompanionStatusResponse {
  boosted:          boolean;
  secondsRemaining: number;
}

export type AiPlanRequestStatus = 'pending' | 'completed' | 'failed';

/** Response shape of POST /ai/plan now that it kicks off a background job instead of returning the plan directly. */
export interface AiPlanKickoffResponse {
  requestId: string;
}

/** Data shape both GET /ai/plan/:requestId/status and GET /ai/plan/history's `result` field carry — matches backend PlanTripResponse minus changeInfo (that's a sibling field, not nested). */
export interface AiPlanResultData {
  title:    string;
  stops:    unknown[];
  transits: unknown[];
}

/** Response shape of GET /ai/plan/:requestId/status. */
export interface AiPlanStatusResponse {
  status:      AiPlanRequestStatus;
  result?:     AiPlanResultData;
  changeInfo?: PlanChangeInfo;
  error?:      string;
}

/** One row from GET /ai/plan/history — a past AI-generated plan the user can revisit read-only. */
export interface AiPlanHistoryItem {
  requestId:     string;
  status:        'completed' | 'failed';
  requestParams: {
    selectedOption: TripSuggestion;
    preferences:    string;
    duration?:      number;
    budget?:        string;
    startDate?:     string;
  };
  result?:       AiPlanResultData;
  error?:        string;
  karmaCharged:  number;
  createdAt:     string;
  completedAt?:  string;
}
