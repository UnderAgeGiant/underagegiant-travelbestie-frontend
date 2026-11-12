import { GUIDE_TOP_PHOTOS } from '../../data/guide-photos.data';

/** Best-rated described sight's photo for a guide's city, precomputed at build time (no attraction file needed). */
export function guideTopPhoto(cityId: string): string | undefined {
  return GUIDE_TOP_PHOTOS[cityId];
}
