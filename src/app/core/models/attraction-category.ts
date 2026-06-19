export type AttractionCategory = 'poi' | 'freetour' | 'event_party' | 'foodie';

export interface CategoryMeta {
  code:                   AttractionCategory;
  label:                  string;
  icon:                   string;
  bg:                     string;
  defaultSubcategoryLabel: string;
}

export const CATEGORY_META: Record<AttractionCategory, CategoryMeta> = {
  poi:         { code: 'poi',         label: 'Puntos de interés', icon: '🏛️', bg: '#E8F0FD', defaultSubcategoryLabel: 'Puntos de interés' },
  freetour:    { code: 'freetour',    label: 'Freetours',         icon: '🚶', bg: '#E8FDE8', defaultSubcategoryLabel: 'Freetours'         },
  event_party: { code: 'event_party', label: 'Eventos/Fiestas',   icon: '🎉', bg: '#FDE8F5', defaultSubcategoryLabel: 'Eventos/Fiestas'   },
  foodie:      { code: 'foodie',      label: 'Foodie',            icon: '🍴', bg: '#FDF5E8', defaultSubcategoryLabel: 'Foodie'            },
};

export const ALL_CATEGORIES = Object.values(CATEGORY_META);
