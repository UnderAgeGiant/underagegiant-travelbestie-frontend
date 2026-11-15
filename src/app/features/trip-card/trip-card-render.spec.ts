import { MIEL_SET, fitTitle, pickMiel, planeLayout, staysLabel, statsLine } from './trip-card-render';

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

  describe('planeLayout', () => {
    it('no band or a band under 200 px → no planes', () => {
      expect(planeLayout(900, 900)).toEqual([]);
      expect(planeLayout(900, 1090)).toEqual([]);
      expect(planeLayout(900, 800)).toEqual([]);
    });
    it('a small band gets 1 plane, a big one 3, never more', () => {
      expect(planeLayout(900, 1150)).toHaveLength(1);
      expect(planeLayout(800, 1100)).toHaveLength(2); // 2-city card
      expect(planeLayout(800, 1230)).toHaveLength(3); // 1-city card
      expect(planeLayout(500, 1150)).toHaveLength(3);
      expect(planeLayout(0, 1900)).toHaveLength(3);
    });
    it('every path and its plane stay inside the band, in order, alternating like About Us', () => {
      const slots = planeLayout(500, 1150);
      expect(slots.map(s => s.curve)).toEqual(['forward', 'reverse', 'forward']);
      expect(slots.map(s => s.color)).toEqual(['lavD', 'peachD', 'mintD']);
      let prev = 500;
      for (const s of slots) {
        expect(s.y - 22).toBeGreaterThanOrEqual(prev); // the plane sits on the path's top edge
        expect(s.h).toBeGreaterThan(0);
        prev = s.y + s.h;
      }
      expect(prev).toBeLessThanOrEqual(1150);
    });
    it('is fixed: the same band gives the same layout', () =>
      expect(planeLayout(500, 1150)).toEqual(planeLayout(500, 1150)));
  });
});
