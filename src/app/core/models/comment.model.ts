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

export interface Attraction {
  id: string;
  name: string;
  type: string;
  icon: string;
  bg: string;
  rating: number;
  estimatedMinutes: number;
  imageUrl?: string;
}
