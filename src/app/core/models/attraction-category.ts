export type AttractionCategory = 'poi' | 'freetour' | 'event_party' | 'foodie';

export interface CategoryMeta {
  code:                   AttractionCategory;
  label:                  string;
  icon:                   string;
  bg:                     string;
  defaultSubcategoryLabel: string;
}

/**
 * Built by a function (not a module-level const) so the $localize calls
 * run lazily, after the app has bootstrapped and the @angular/localize
 * polyfill is loaded — a top-level const would evaluate $localize at
 * module-import time, before that's guaranteed to be ready.
 */
export function getCategoryMeta(): Record<AttractionCategory, CategoryMeta> {
  const poiLabel   = $localize`:@@category.poi:Puntos de interés`;
  const eventLabel = $localize`:@@category.eventParty:Eventos/Fiestas`;
  return {
    poi:         { code: 'poi',         label: poiLabel,                             icon: '🏛️', bg: '#E8F0FD', defaultSubcategoryLabel: poiLabel },
    freetour:    { code: 'freetour',    label: $localize`:@@category.freetour:Freetours`, icon: '🚶', bg: '#E8FDE8', defaultSubcategoryLabel: $localize`:@@category.freetour:Freetours` },
    event_party: { code: 'event_party', label: eventLabel,                           icon: '🎉', bg: '#FDE8F5', defaultSubcategoryLabel: eventLabel },
    foodie:      { code: 'foodie',      label: $localize`:@@category.foodie:Foodie`,       icon: '🍴', bg: '#FDF5E8', defaultSubcategoryLabel: $localize`:@@category.foodie:Foodie` },
  };
}

export function getAllCategories(): CategoryMeta[] {
  return Object.values(getCategoryMeta());
}
