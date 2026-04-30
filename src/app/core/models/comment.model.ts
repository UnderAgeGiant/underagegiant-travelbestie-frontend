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
