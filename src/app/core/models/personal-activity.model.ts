// Feature 71 — the ONE place the personal-activity type list lives. The backend and DB only
// check the id's format (/^[a-z_]{1,30}$/). Adding a type: add an entry here + its i18n units
// + its Miel illustration at public/personal/<type>.webp (1024×1024) — no backend change.
// `image: null` is allowed; views then fall back to icon on bg.
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
    { type: 'breakfast', label: $localize`:@@personal.breakfast:Desayuno`,     icon: '🥐', image: '/personal/breakfast.webp', bg: '#FDF3E8', minutes: 45 },
    { type: 'lunch',     label: $localize`:@@personal.lunch:Almuerzo`,         icon: '🍽️', image: '/personal/lunch.webp', bg: '#FDEFE8', minutes: 60 },
    { type: 'dinner',    label: $localize`:@@personal.dinner:Cena`,            icon: '🍝', image: '/personal/dinner.webp', bg: '#F3E8FD', minutes: 90 },
    { type: 'coffee',    label: $localize`:@@personal.coffee:Café`,            icon: '☕', image: '/personal/coffee.webp', bg: '#F5EDE4', minutes: 30 },
    { type: 'walk',      label: $localize`:@@personal.walk:Paseo`,             icon: '🚶', image: '/personal/walk.webp', bg: '#E8FDE8', minutes: 60 },
    { type: 'rest',      label: $localize`:@@personal.rest:Descanso`,          icon: '😴', image: '/personal/rest.webp', bg: '#E8F0FD', minutes: 90 },
    { type: 'shopping',  label: $localize`:@@personal.shopping:Compras`,       icon: '🛍️', image: '/personal/shopping.webp', bg: '#FDE8F5', minutes: 90 },
    { type: 'free_time', label: $localize`:@@personal.freeTime:Tiempo libre`,  icon: '✨', image: '/personal/free_time.webp', bg: '#FDFBE8', minutes: 60 },
  ];
}

export function activityMeta(type: string | undefined): PersonalActivityMeta {
  const all = getPersonalActivityMetas();
  return all.find(m => m.type === type) ?? all.find(m => m.type === 'free_time')!;
}
