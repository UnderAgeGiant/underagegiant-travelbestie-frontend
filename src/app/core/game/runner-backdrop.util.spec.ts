import { backdropImages, ICONIC_BACKDROP_CITIES } from './runner-backdrop.util';

describe('backdropImages', () => {
  it('every iconic city exists and yields at least one https image', () => {
    for (const id of ICONIC_BACKDROP_CITIES) expect(backdropImages([id], 1)).toHaveLength(1);
  });
  it('uses the given cities, interleaved, capped, https only, no duplicates', () => {
    const imgs = backdropImages(['paris', 'rome'], 4);
    expect(imgs).toHaveLength(4);
    expect(imgs.every(u => u.startsWith('https://'))).toBe(true);
    expect(new Set(imgs).size).toBe(4);
  });
  it('falls back to the iconic list for unknown / empty cities', () => {
    expect(backdropImages([])).toEqual(backdropImages(ICONIC_BACKDROP_CITIES));
    expect(backdropImages(['no-such-city'])).toEqual(backdropImages(ICONIC_BACKDROP_CITIES));
  });
});
