/** A single fullscreen slide — an attraction or a transit leg segment. */
export interface SlideshowItem {
  id:           string;
  name:         string;
  type:         string;
  icon:         string;
  imageUrl:     string | null;
  description?: string | null;  // localized attraction description; null/absent for transit segments and attractions with no description
  startDate:    string | null;  // dd/mm/yyyy
  startTime:    string | null;  // HH:mm
  endDate:      string | null;  // dd/mm/yyyy
  endTime:      string | null;  // HH:mm
}
