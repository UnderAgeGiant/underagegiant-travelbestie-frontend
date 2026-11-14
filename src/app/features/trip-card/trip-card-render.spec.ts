import { MIEL_SET, fitTitle, pickMiel, statsLine } from './trip-card-render';

describe('trip card render helpers', () => {
  it('pickMiel covers both images and both sides', () => {
    expect(pickMiel(() => 0)).toEqual({ src: MIEL_SET[0], side: 'left' });
    expect(pickMiel(() => 0.99)).toEqual({ src: MIEL_SET[1], side: 'right' });
  });

  it('fitTitle wraps to at most 3 lines and ends the last with …', () => {
    const lines = fitTitle('palabra '.repeat(40).trim(), s => s.length * 10, 300);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith('…')).toBe(true);
    lines.forEach(l => expect(l.length * 10).toBeLessThanOrEqual(300));
  });

  it('fitTitle keeps a short title on one line', () =>
    expect(fitTitle('Roma', s => s.length * 10, 300)).toEqual(['Roma']));

  it('fitTitle breaks a single word longer than the line', () => {
    const lines = fitTitle('x'.repeat(100), s => s.length * 10, 300);
    expect(lines).toHaveLength(3);
    lines.forEach(l => expect(l.length * 10).toBeLessThanOrEqual(300));
  });

  it('statsLine uses singulars and drops zero/unknown parts', () => {
    expect(statsLine({ cities: 1, places: 0, days: 1 })).toBe('1 ciudad · 1 día');
    expect(statsLine({ cities: 8, places: 61, days: null })).toBe('8 ciudades · 61 lugares');
    expect(statsLine({ cities: 2, places: 1, days: 21 })).toBe('2 ciudades · 1 lugar · 21 días');
  });
});
