import { computePasswordStrength, passwordStrengthColor, isPasswordStrengthBarActive } from './password-strength.util';

describe('computePasswordStrength', () => {
  it('returns none for an empty password', () => {
    expect(computePasswordStrength('')).toBe('none');
  });

  it('returns vulnerable for a short password regardless of character classes', () => {
    expect(computePasswordStrength('Ab1!')).toBe('vulnerable');
  });

  it('returns vulnerable for a long password with too few character classes', () => {
    expect(computePasswordStrength('lowercaseonly')).toBe('vulnerable');
  });

  it('returns light for a password hitting exactly 3 of the 5 score criteria', () => {
    expect(computePasswordStrength('lowercase1')).toBe('light');
  });

  it('returns strong for a long password covering all character classes', () => {
    expect(computePasswordStrength('Abcdefg1!')).toBe('strong');
  });
});

describe('passwordStrengthColor', () => {
  it('maps each strength to its color, defaulting for none', () => {
    expect(passwordStrengthColor('none')).toBe('var(--t3)');
    expect(passwordStrengthColor('vulnerable')).toBe('oklch(55% 0.22 25)');
    expect(passwordStrengthColor('light')).toBe('oklch(62% 0.14 60)');
    expect(passwordStrengthColor('strong')).toBe('oklch(50% 0.16 145)');
  });
});

describe('isPasswordStrengthBarActive', () => {
  it('lights only the first bar for vulnerable', () => {
    expect(isPasswordStrengthBarActive('vulnerable', 0)).toBe(true);
    expect(isPasswordStrengthBarActive('vulnerable', 1)).toBe(false);
    expect(isPasswordStrengthBarActive('vulnerable', 2)).toBe(false);
  });

  it('lights the first two bars for light', () => {
    expect(isPasswordStrengthBarActive('light', 0)).toBe(true);
    expect(isPasswordStrengthBarActive('light', 1)).toBe(true);
    expect(isPasswordStrengthBarActive('light', 2)).toBe(false);
  });

  it('lights every bar for strong', () => {
    expect(isPasswordStrengthBarActive('strong', 0)).toBe(true);
    expect(isPasswordStrengthBarActive('strong', 2)).toBe(true);
  });

  it('lights no bar for none', () => {
    expect(isPasswordStrengthBarActive('none', 0)).toBe(false);
  });
});
