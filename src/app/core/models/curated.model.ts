import { Attraction } from '../models/comment.model';

export type CuratedMap = Record<string, Omit<Attraction, 'id'>[]>;