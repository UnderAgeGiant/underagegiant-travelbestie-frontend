// Feature 71 — the ONE place the personal-activity type list lives. The backend and DB only
// check the id's format (/^[a-z_]{1,30}$/). Adding a type: add an entry here + its i18n units
// + (optionally) public/personal/<type>.webp — no backend change. `image` is null until the
// owner delivers the Miel art; views then fall back to icon on bg.
export interface PersonalActivityMeta {
  type: string;
  label: string;
  icon: string;
  image: string | null;
  bg: string;
  minutes: number;
}

// Function, not const: $localize must run lazily (same convention as getCategoryMeta()).
export function getPersonalActivityMetas(): PersonalActivityMeta[] {
  return [
    { type: 'breakfast', label: $localize`:@@personal.breakfast:Desayuno`,     icon: '🥐', image: null, bg: '#FDF3E8', minutes: 45 },
    { type: 'lunch',     label: $localize`:@@personal.lunch:Almuerzo`,         icon: '🍽️', image: null, bg: '#FDEFE8', minutes: 60 },
    { type: 'dinner',    label: $localize`:@@personal.dinner:Cena`,            icon: '🍝', image: null, bg: '#F3E8FD', minutes: 90 },
    { type: 'coffee',    label: $localize`:@@personal.coffee:Café`,            icon: '☕', image: null, bg: '#F5EDE4', minutes: 30 },
    { type: 'walk',      label: $localize`:@@personal.walk:Paseo`,             icon: '🚶', image: null, bg: '#E8FDE8', minutes: 60 },
    { type: 'rest',      label: $localize`:@@personal.rest:Descanso`,          icon: '😴', image: null, bg: '#E8F0FD', minutes: 90 },
    { type: 'shopping',  label: $localize`:@@personal.shopping:Compras`,       icon: '🛍️', image: null, bg: '#FDE8F5', minutes: 90 },
    { type: 'free_time', label: $localize`:@@personal.freeTime:Tiempo libre`,  icon: '✨', image: null, bg: '#FDFBE8', minutes: 60 },
  ];
}

export function activityMeta(type: string | undefined): PersonalActivityMeta {
  const all = getPersonalActivityMetas();
  return all.find(m => m.type === type) ?? all.find(m => m.type === 'free_time')!;
}
