import { Attraction } from '../models/comment.model';
import { AppLocale } from '../i18n/locale.util';
import { normalizeSearch } from './normalize-search.util';

/** The attraction name in the page language: `nameEn` for en-US (falling back to the Spanish `name`), else `name`. */
export function attractionName(a: Pick<Attraction, 'name' | 'nameEn'>, locale: AppLocale): string {
  return locale === 'en-US' ? (a.nameEn || a.name) : a.name;
}

/** The native name for the muted sub-label, or null when absent or identical (case/accent-insensitive) to the displayed name. */
export function attractionNativeLabel(a: Pick<Attraction, 'name' | 'nameEn' | 'nativeName'>, locale: AppLocale): string | null {
  if (!a.nativeName) return null;
  return normalizeSearch(a.nativeName) === normalizeSearch(attractionName(a, locale)) ? null : a.nativeName;
}

/** True when the query matches the Spanish, English or native name, or the type. An empty query matches everything. */
export function matchesAttractionQuery(a: Pick<Attraction, 'name' | 'nameEn' | 'nativeName' | 'type'>, query: string): boolean {
  const q = normalizeSearch(query.trim());
  if (!q) return true;
  return [a.name, a.nameEn, a.nativeName, a.type].some(f => !!f && normalizeSearch(f).includes(q));
}
