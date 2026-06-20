import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  otherLocale,
  localeFromNavigator,
  stripLocalePrefix,
  readLocaleCookie,
} from './locale.util';

describe('locale.util', () => {
  it('exposes exactly the two supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['es-CL', 'en-US']);
    expect(DEFAULT_LOCALE).toBe('es-CL');
  });

  it('validates supported locales', () => {
    expect(isSupportedLocale('es-CL')).toBe(true);
    expect(isSupportedLocale('en-US')).toBe(true);
    expect(isSupportedLocale('fr-FR')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });

  it('returns the opposite locale', () => {
    expect(otherLocale('es-CL')).toBe('en-US');
    expect(otherLocale('en-US')).toBe('es-CL');
  });

  it('maps navigator.language to a supported locale, defaulting to es-CL', () => {
    expect(localeFromNavigator('es')).toBe('es-CL');
    expect(localeFromNavigator('es-AR')).toBe('es-CL');
    expect(localeFromNavigator('en')).toBe('en-US');
    expect(localeFromNavigator('en-GB')).toBe('en-US');
    expect(localeFromNavigator('de-DE')).toBe('es-CL'); // default
    expect(localeFromNavigator('')).toBe('es-CL');
    expect(localeFromNavigator(undefined)).toBe('es-CL');
  });

  it('strips a leading /<locale>/ prefix from a pathname', () => {
    expect(stripLocalePrefix('/es-CL/')).toBe('/');
    expect(stripLocalePrefix('/en-US/')).toBe('/');
    expect(stripLocalePrefix('/es-CL/profile')).toBe('/profile');
    expect(stripLocalePrefix('/en-US/foo/bar')).toBe('/foo/bar');
    expect(stripLocalePrefix('/')).toBe('/');            // no prefix
    expect(stripLocalePrefix('/profile')).toBe('/profile'); // no prefix
  });

  it('reads the tb_locale cookie out of a document.cookie string', () => {
    expect(readLocaleCookie('a=1; tb_locale=en-US; b=2')).toBe('en-US');
    expect(readLocaleCookie('tb_locale=es-CL')).toBe('es-CL');
    expect(readLocaleCookie('tb_locale=fr-FR')).toBe(null); // unsupported → null
    expect(readLocaleCookie('other=x')).toBe(null);
    expect(readLocaleCookie('')).toBe(null);
  });
});
