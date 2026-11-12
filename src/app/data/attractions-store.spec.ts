import { computed } from '@angular/core';
import {
  __setAttractionSourceForTests,
  attractionsStatus,
  findCuratedAttraction,
  getAttractions,
  loadCityAttractions,
  retryCityAttractions,
} from './attractions.data';
import { WORLD_CITIES } from './cities.data';
import { City } from '../core/models/city.model';

const PARIS = WORLD_CITIES.find(c => c.id === 'paris') as City;
const jestSource = (globalThis as Record<string, unknown>)['__tbJestAttractionSource'] as Parameters<typeof __setAttractionSourceForTests>[0];

const attr = (id: string, active: boolean) => ({
  id, name: id, type: 'Histórico', category: 'poi', active, icon: '🏛️', bg: '#E8F0FD',
  rating: 4.5, estimatedMinutes: 60,
});
const okJson = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
const parisFile = () => okJson([attr('paris_0', true), attr('paris_1', false)]);

let fetchMock: jest.Mock;
const realFetch = globalThis.fetch;

beforeEach(() => {
  __setAttractionSourceForTests(null);
  fetchMock = jest.fn(parisFile);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  __setAttractionSourceForTests(jestSource);
});

describe('on-demand attraction store', () => {
  it('returns [] and requests the city file once, then serves it', async () => {
    expect(getAttractions(PARIS)).toEqual([]);
    getAttractions(PARIS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/data/attractions/paris.json');

    await loadCityAttractions(['paris']);
    expect(attractionsStatus('paris')).toBe('ready');
    expect(getAttractions(PARIS).some(a => a.id === 'paris_0')).toBe(true);
    expect(getAttractions(PARIS).some(a => a.id === 'paris_1')).toBe(false);
    expect(findCuratedAttraction('paris', 'paris_1')?.active).toBe(false);
  });

  it('attractionsStatus alone starts the city load, exactly once', async () => {
    expect(attractionsStatus('paris')).toBe('loading');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await loadCityAttractions(['paris']);
    expect(attractionsStatus('paris')).toBe('ready');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('marks a failed city as error and does not refetch until retry', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error('network down')));
    await loadCityAttractions(['paris']);
    expect(attractionsStatus('paris')).toBe('error');

    getAttractions(PARIS);
    findCuratedAttraction('paris', 'paris_0');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    retryCityAttractions('paris');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats a non-array body as error', async () => {
    fetchMock.mockImplementation(() => okJson({ not: 'an array' }));
    await loadCityAttractions(['paris']);
    expect(attractionsStatus('paris')).toBe('error');
  });

  it('treats a 404 as error', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) } as Response));
    await loadCityAttractions(['paris']);
    expect(attractionsStatus('paris')).toBe('error');
  });

  it.each(['../x', 'not_a_city', ''])('never requests unknown city id %p', async id => {
    expect(findCuratedAttraction(id, 'x_0')).toBeUndefined();
    await loadCityAttractions([id]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(attractionsStatus(id)).toBe('ready');
  });

  it('a computed that reads getAttractions re-evaluates when the file arrives', async () => {
    const names = computed(() => getAttractions(PARIS).map(a => a.id));
    expect(names()).not.toContain('paris_0');
    await loadCityAttractions(['paris']);
    expect(names()).toContain('paris_0');
  });
});
