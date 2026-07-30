import { countryCodeFromFlagEmoji } from './flag-emoji.util';

describe('flag-emoji.util', () => {
  it('converts a two-letter regional-indicator flag emoji to a lowercase ISO code', () => {
    expect(countryCodeFromFlagEmoji('🇫🇷')).toBe('fr');
    expect(countryCodeFromFlagEmoji('🇬🇧')).toBe('gb');
    expect(countryCodeFromFlagEmoji('🇨🇱')).toBe('cl');
    expect(countryCodeFromFlagEmoji('🇯🇵')).toBe('jp');
  });

  it('returns null for anything that is not a two-letter flag emoji', () => {
    expect(countryCodeFromFlagEmoji('📍')).toBeNull();   // the "no city found" fallback glyph used elsewhere in the app
    expect(countryCodeFromFlagEmoji('🏠')).toBeNull();   // home-address fallback glyph (unrelated, must not be treated as a flag)
    expect(countryCodeFromFlagEmoji('')).toBeNull();
    expect(countryCodeFromFlagEmoji('AB')).toBeNull();    // plain ASCII, not regional-indicator codepoints
  });
});
