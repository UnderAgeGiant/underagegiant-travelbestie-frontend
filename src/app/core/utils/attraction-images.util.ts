import { Attraction } from '../models/comment.model';

/** Ordered, deduplicated list of an attraction's photos: the cover `imageUrl` first, then any `images` extras. */
export function attractionImages(attraction: Pick<Attraction, 'imageUrl' | 'images'>): string[] {
  const combined = [attraction.imageUrl, ...(attraction.images ?? [])];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of combined) {
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}
