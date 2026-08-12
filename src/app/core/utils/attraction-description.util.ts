import { Attraction } from '../models/comment.model';
import { AppLocale } from '../i18n/locale.util';

/**
 * Picks the description matching the active locale. Falls back to the
 * Spanish source text for en-US when no English translation has been
 * generated yet — better to show something than nothing.
 */
export function localizedDescription(attraction: Attraction, locale: AppLocale): string | undefined {
  return locale === 'en-US' ? (attraction.descriptionEn ?? attraction.description) : attraction.description;
}
