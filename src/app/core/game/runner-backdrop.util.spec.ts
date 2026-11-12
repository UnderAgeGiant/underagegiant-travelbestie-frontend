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

  it('is [] while a requested city is in flight, even when the iconic fallback is ready', async () => {
    __setAttractionSourceForTests(null);
    // Lima is not an iconic city, so it can be loading while the iconic fallback is already ready.
    const photo = (cityId: string) => [{ id: `${cityId}_0`, name: cityId, type: 'Museo', category: 'poi', active: true, icon: '🏛️', bg: '#fff',
      rating: 4.7, estimatedMinutes: 90, description: 'Descripción suficientemente larga para pasar el umbral de sesenta caracteres.',
      imageUrl: `https://upload.wikimedia.org/wikipedia/commons/${cityId}.jpg` }];
    let releaseLima!: (r: Response) => void;
    globalThis.fetch = jest.fn((url: string) => {
      const cityId = url.match(/\/([^/]+)\.json$/)![1];
      if (cityId === 'lima') return new Promise<Response>(res => { releaseLima = res; });
      return Promise.resolve({ ok: true, status: 200, json: async () => photo(cityId) } as Response);
    }) as unknown as typeof fetch;

    await loadCityAttractions(ICONIC_BACKDROP_CITIES);
    expect(backdropImages(ICONIC_BACKDROP_CITIES).length).toBeGreaterThan(0); // the fallback itself has photos
    expect(backdropImages(['lima'])).toEqual([]); // guard: lima in flight, must not fall back to iconic

    releaseLima({ ok: true, status: 200, json: async () => photo('lima') } as Response);
    await loadCityAttractions(['lima']);
    expect(backdropImages(['lima'])).toEqual(['https://upload.wikimedia.org/wikipedia/commons/lima.jpg']);
  });
});
