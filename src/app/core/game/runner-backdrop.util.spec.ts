import { backdropImages, ICONIC_BACKDROP_CITIES } from './runner-backdrop.util';
import { __setAttractionSourceForTests, loadCityAttractions } from '../../data/attractions.data';

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

describe('backdropImages while a city file loads', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    __setAttractionSourceForTests((globalThis as any).__tbJestAttractionSource);
  });

  it('is [] while Paris is loading, then returns Paris photos once its file arrives', async () => {
    __setAttractionSourceForTests(null);
    const sight = { id: 'paris_0', name: 'Louvre', type: 'Museo', category: 'poi', active: true, icon: '🏛️', bg: '#fff',
      rating: 4.7, estimatedMinutes: 90, description: 'Descripción suficientemente larga para pasar el umbral de sesenta caracteres.',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Louvre.jpg' };
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [sight] }) as unknown as typeof fetch;

    expect(backdropImages(['paris'])).toEqual([]);
    await loadCityAttractions(['paris']);
    expect(backdropImages(['paris'])).toEqual([sight.imageUrl]);
  });
});
