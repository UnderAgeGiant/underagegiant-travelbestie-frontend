import { AttractionCategory } from './attraction-category';

export interface Comment {
  id?: string;
  attractionId: string;
  name: string;
  text: string;
  rating: number;
  color: string;
  date: string;
  createdAt?: string;
}

export interface StepComment {
  id:         string;
  stepKey:    string;
  authorName: string;
  text:       string;
  createdAt:  string;
}

export interface StepCommentAddResult {
  comment:      StepComment;
  karmaAwarded: boolean;
}

export interface DayHours { open: string; close: string; }
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeeklySchedule = Partial<Record<WeekDay, DayHours | 'closed'>> & { notes?: string };

export interface TicketPrices {
  adult?:    string;
  child?:    string;
  senior?:   string;
  free:      boolean;
  currency?: string;
  notes?:    string;
}

export interface Attraction {
  id:               string;
  name:             string;
  type:             string;
  category:         AttractionCategory;
  active:           boolean;
  icon:             string;
  bg:               string;
  rating:           number;
  estimatedMinutes: number;
  imageUrl?:        string;
  description?:     string;
  website?:         string | null;
  schedule?:        WeeklySchedule | null;
  ticketUrl?:       string | null;
  ticketPrices?:    TicketPrices | null;
}
