export type AppLocale = 'es-CL' | 'en-US';

export const SUPPORTED_LOCALES: AppLocale[] = ['es-CL', 'en-US'];
export const DEFAULT_LOCALE: AppLocale = 'es-CL';
export const LOCALE_STORAGE_KEY = 'tb_locale';

export function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'es-CL' || value === 'en-US';
}

export function otherLocale(locale: AppLocale): AppLocale {
  return locale === 'es-CL' ? 'en-US' : 'es-CL';
}

/** Map a raw navigator.language (e.g. "en-GB") to a supported locale; defaults to es-CL. */
export function localeFromNavigator(lang: string | undefined | null): AppLocale {
  const lower = (lang ?? '').toLowerCase();
  if (lower.startsWith('en')) return 'en-US';
  if (lower.startsWith('es')) return 'es-CL';
  return DEFAULT_LOCALE;
}

/** Remove a leading "/es-CL" or "/en-US" segment from a pathname, keeping the rest. */
export function stripLocalePrefix(pathname: string): string {
  for (const loc of SUPPORTED_LOCALES) {
    if (pathname === `/${loc}` || pathname === `/${loc}/`) return '/';
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(`/${loc}`.length);
  }
  return pathname;
}

/** Parse a document.cookie string and return the tb_locale value if it is a supported locale. */
export function readLocaleCookie(cookie: string): AppLocale | null {
  const match = cookie.match(/(?:^|;\s*)tb_locale=([^;]+)/);
  const value = match?.[1];
  return isSupportedLocale(value) ? value : null;
}
