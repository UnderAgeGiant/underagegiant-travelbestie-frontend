import { SUPPORTED_LOCALES, DEFAULT_LOCALE, isSupportedLocale, otherLocale } from './locale.util';

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
    expect(isSupportedLocale(undefined)).toBe(false);
  });

  it('returns the opposite locale', () => {
    expect(otherLocale('es-CL')).toBe('en-US');
    expect(otherLocale('en-US')).toBe('es-CL');
  });
});
