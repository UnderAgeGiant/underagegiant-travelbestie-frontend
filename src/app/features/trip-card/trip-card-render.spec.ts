import { MIEL_SET, fitTitle, PLANE_SLOTS, pickMiel, planeEnd, staysLabel, statsLine } from './trip-card-render';

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

  it('fitTitle with maxLines 1 ellipsizes a long city name to the width', () => {
    const [line, ...rest] = fitTitle('San Cristóbal de las Casas', s => s.length * 10, 150, 1);
    expect(rest).toEqual([]);
    expect(line.endsWith('…')).toBe(true);
    expect(line.length * 10).toBeLessThanOrEqual(150);
  });

  it('statsLine uses singulars and drops zero/unknown parts', () => {
    expect(statsLine({ cities: 1, places: 0, days: 1, nights: null })).toBe('1 ciudad · 1 día');
    expect(statsLine({ cities: 8, places: 61, days: null, nights: null })).toBe('8 ciudades · 61 lugares');
    expect(statsLine({ cities: 2, places: 1, days: 21, nights: 20 })).toBe('2 ciudades · 1 lugar · 21 días · 20 noches');
    expect(statsLine({ cities: 2, places: 4, days: 2, nights: 1 })).toBe('2 ciudades · 4 lugares · 2 días · 1 noche');
  });

  it('staysLabel joins days and nights, dropping a missing part', () => {
    expect(staysLabel(4, 4)).toBe('4 días · 4 noches');
    expect(staysLabel(1, null)).toBe('1 día');
    expect(staysLabel(null, 1)).toBe('1 noche');
    expect(staysLabel(null, null)).toBe('');
  });

  describe('PLANE_SLOTS (card background)', () => {
    it('is one fixed set of 3, the same for every trip length', () => {
      expect(PLANE_SLOTS.map(p => p.curve)).toEqual(['forward', 'reverse', 'forward']);
      expect(PLANE_SLOTS.map(p => p.color)).toEqual(['lavD', 'peachD', 'mintD']);
    });
    it('spans the middle of the card, above the QR tile (top ≥ 1288 on every card)', () => {
      for (const p of PLANE_SLOTS) {
        expect(p.y - 22).toBeGreaterThanOrEqual(700);
        expect(p.y + p.h).toBeLessThanOrEqual(1260);
      }
    });
    it('keeps every plane icon inside the 90 px side margins (N12)', () => {
      for (const p of PLANE_SLOTS) {
        const { x } = planeEnd(p);
        expect(x - 22).toBeGreaterThanOrEqual(90);
        expect(x + 22).toBeLessThanOrEqual(990 + 1e-9);
      }
    });
  });
});
