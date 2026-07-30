export type AppLocale = 'es-CL' | 'en-US';

/** Shell panels that can be reopened after a locale-switch reload. */
export type RestoreView = 'profile' | 'ai' | 'mytrips';

export const SUPPORTED_LOCALES: AppLocale[] = ['es-CL', 'en-US'];
export const DEFAULT_LOCALE: AppLocale = 'es-CL';

/** Cookie the Vercel edge rewrite reads to pick which locale bundle to serve. */
export const LOCALE_COOKIE_KEY = 'tb_locale';

/** One-shot sessionStorage key remembering the open shell panel across a switch reload. */
export const VIEW_RESTORE_KEY = 'tb_restore_view';

export function isSupportedLocale(value: unknown): value is AppLocale {
  return value === 'es-CL' || value === 'en-US';
}

export function otherLocale(locale: AppLocale): AppLocale {
  return locale === 'es-CL' ? 'en-US' : 'es-CL';
}
