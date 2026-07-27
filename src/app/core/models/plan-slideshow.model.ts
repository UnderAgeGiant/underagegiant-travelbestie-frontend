/** A single fullscreen slide — an attraction or a transit leg segment. */
export interface SlideshowItem {
  id:        string;
  name:      string;
  type:      string;
  icon:      string;
  imageUrl:  string | null;
  startDate: string | null;  // dd/mm/yyyy
  startTime: string | null;  // HH:mm
  endDate:   string | null;  // dd/mm/yyyy
  endTime:   string | null;  // HH:mm
}
