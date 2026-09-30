export type AppLocale = 'es-CL' | 'en-US';

export const SUPPORTED_LOCALES: AppLocale[] = ['es-CL', 'en-US'];
export const DEFAULT_LOCALE: AppLocale = 'es-CL';

/** Cookie the Vercel edge rewrite reads to pick which locale bundle to serve. */
export const LOCALE_COOKIE_KEY = 'tb_locale';

export function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'es-CL' || value === 'en-US';
}

export function otherLocale(locale: AppLocale): AppLocale {
  return locale === 'es-CL' ? 'en-US' : 'es-CL';
}
