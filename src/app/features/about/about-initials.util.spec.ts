import { getInitials } from './about-initials.util';

describe('getInitials', () => {
  it('returns the first letter of the first two words, uppercased', () => {
    expect(getInitials('Yoli Fuentes')).toBe('YF');
  });

  it('returns a single letter for a one-word name', () => {
    expect(getInitials('Ceci')).toBe('C');
  });

  it('ignores surrounding whitespace and any name parts beyond the first two', () => {
    expect(getInitials('  Maria   Miel de las Mercedes Echevarria Echaurren  ')).toBe('MM');
  });
});
