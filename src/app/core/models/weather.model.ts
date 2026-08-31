export type WeatherDayType = 'forecast' | 'historic' | 'unavailable';

export interface WeatherDay {
  date: string;   // dd/mm/yyyy — matches this app's date convention throughout
  type: WeatherDayType;
  tempMaxC?: number;
  tempMinC?: number;
  weatherCode?: number;
}

export interface WeatherCodeMeta {
  icon: string;
}

// WMO weather-code groups, per Open-Meteo's documented table
// (https://open-meteo.com/en/docs — "WMO Weather interpretation codes").
// Backend sends the raw numeric code; this frontend-owned mapping is the only
// place icon/presentation logic lives, mirroring the CATEGORY_META split in
// attraction-category.ts.
const WEATHER_ICON_GROUPS: Array<{ codes: number[]; icon: string }> = [
  { codes: [0], icon: '☀️' },
  { codes: [1, 2], icon: '🌤️' },
  { codes: [3], icon: '☁️' },
  { codes: [45, 48], icon: '🌫️' },
  { codes: [51, 53, 55, 56, 57], icon: '🌦️' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], icon: '🌧️' },
  { codes: [71, 73, 75, 77, 85, 86], icon: '❄️' },
  { codes: [95, 96, 99], icon: '⛈️' },
];

const FALLBACK_ICON = '🌡️';

export function getWeatherCodeMeta(code: number): WeatherCodeMeta {
  const group = WEATHER_ICON_GROUPS.find(g => g.codes.includes(code));
  return { icon: group?.icon ?? FALLBACK_ICON };
}
