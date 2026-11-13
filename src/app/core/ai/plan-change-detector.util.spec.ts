import {
  serializeOptions,
  computeChangeRatio,
  isMinorChange,
  toSessionOptions,
  CHANGE_THRESHOLD,
} from './plan-change-detector.util';
import { PlanSessionOptions, TripSuggestion } from '../models/ai.model';

const baseOpts: PlanSessionOptions = {
  selectedOptionTitle:      'Clásicos de Europa',
  selectedOptionSummary:    'París, Roma y Barcelona en un viaje lleno de arte.',
  selectedOptionHighlights: ['París, Francia', 'Roma, Italia', 'Barcelona, España'],
  preferences:              'viaje romántico con gastronomía',
  duration:                 14,
  budget:                   '1000 USD',
  startDate:                '15/07/2026',
  cityIds:                  [],
};

describe('serializeOptions', () => {
  it('normalizes to lowercase and trims whitespace', () => {
    const a = serializeOptions({ ...baseOpts, preferences: '  Viaje ROMÁNTICO  ' });
    const b = serializeOptions({ ...baseOpts, preferences: 'viaje romántico' });
    expect(a).toBe(b);
  });

  it('sorts highlights so order does not matter', () => {
    const a = serializeOptions({ ...baseOpts, selectedOptionHighlights: ['Roma', 'París'] });
    const b = serializeOptions({ ...baseOpts, selectedOptionHighlights: ['París', 'Roma'] });
    expect(a).toBe(b);
  });
});

describe('computeChangeRatio', () => {
  it('returns 0 for identical options', () => {
    expect(computeChangeRatio(baseOpts, { ...baseOpts })).toBe(0);
  });

  it('returns ratio > CHANGE_THRESHOLD for completely different destination', () => {
    const other: PlanSessionOptions = {
      selectedOptionTitle:      'Japón y Corea del Sur',
      selectedOptionSummary:    'Tokio, Kioto y Seúl: tecnología y tradición.',
      selectedOptionHighlights: ['Tokio, Japón', 'Kioto, Japón', 'Seúl, Corea del Sur'],
      preferences:              'tecnología y naturaleza en asia',
      duration:                 10,
      budget:                   '500 USD',
      startDate:                '01/03/2027',
      cityIds:                  [],
    };
    expect(computeChangeRatio(baseOpts, other)).toBeGreaterThan(CHANGE_THRESHOLD);
  });

  it('returns ratio <= CHANGE_THRESHOLD for a small tweak in preferences', () => {
    expect(
      computeChangeRatio(baseOpts, { ...baseOpts, preferences: 'viaje romántico con gastronomía francesa' })
    ).toBeLessThanOrEqual(CHANGE_THRESHOLD);
  });
});

describe('isMinorChange', () => {
  it('returns true for identical options', () => {
    expect(isMinorChange(baseOpts, { ...baseOpts })).toBe(true);
  });

  it('returns false for a completely different destination', () => {
    const other: PlanSessionOptions = {
      ...baseOpts,
      selectedOptionTitle:      'Ruta Sudamericana',
      selectedOptionSummary:    'Buenos Aires y Río en verano.',
      selectedOptionHighlights: ['Buenos Aires, Argentina', 'Río de Janeiro, Brasil'],
    };
    expect(isMinorChange(baseOpts, other)).toBe(false);
  });
});

describe('toSessionOptions', () => {
  it('converts a plan request to PlanSessionOptions', () => {
    const suggestion: TripSuggestion = {
      id: 1,
      title:      baseOpts.selectedOptionTitle,
      summary:    baseOpts.selectedOptionSummary,
      highlights: baseOpts.selectedOptionHighlights,
    };
    expect(toSessionOptions({
      selectedOption: suggestion,
      preferences:    baseOpts.preferences,
      duration:       baseOpts.duration,
      budget:         baseOpts.budget,
      startDate:      baseOpts.startDate,
    })).toEqual(baseOpts);
  });

  it('defaults duration to 0 when undefined', () => {
    const result = toSessionOptions({
      selectedOption: { id: 1, title: 'T', summary: 'S', highlights: [] },
      preferences: 'test',
    });
    expect(result.duration).toBe(0);
    expect(result.budget).toBe('');
    expect(result.startDate).toBe('');
  });
});

describe('cityIds (F79 cities mode)', () => {
  const five = ['paris', 'rome', 'barcelona', 'lisbon', 'madrid'];
  const cityOpts: PlanSessionOptions = { ...baseOpts, preferences: '', cityIds: five };

  it('serializes cityIds sorted as the last key (byte-identical to the backend)', () => {
    const s = serializeOptions({ ...cityOpts, cityIds: ['rome', 'paris'] });
    expect(s.endsWith(',"cityIds":["paris","rome"]}')).toBe(true);
  });

  it('swapping one of five cities is a minor change', () => {
    const swapped = { ...cityOpts, cityIds: ['paris', 'rome', 'barcelona', 'lisbon', 'porto'] };
    expect(computeChangeRatio(cityOpts, swapped)).toBeLessThanOrEqual(CHANGE_THRESHOLD);
    expect(isMinorChange(cityOpts, swapped)).toBe(true);
  });

  it('replacing four of five cities is a major change', () => {
    const replaced = { ...cityOpts, cityIds: ['paris', 'tokyo', 'kyoto', 'seoul', 'bangkok'] };
    expect(isMinorChange(cityOpts, replaced)).toBe(false);
  });

  it('swapping one of two cities is a major change, adding a sixth to five is minor', () => {
    expect(isMinorChange({ ...cityOpts, cityIds: ['paris', 'rome'] }, { ...cityOpts, cityIds: ['paris', 'tokyo'] })).toBe(false);
    expect(isMinorChange(cityOpts, { ...cityOpts, cityIds: [...five, 'porto'] })).toBe(true);
  });

  it('switching from cities mode to free text is always major', () => {
    const oldOpts = { ...baseOpts, preferences: '', cityIds: ['paris'] };
    const newOpts = { ...baseOpts, preferences: 'museos', cityIds: [] };
    expect(isMinorChange(oldOpts, newOpts)).toBe(false);
    expect(isMinorChange(newOpts, oldOpts)).toBe(false);
  });

  it('treats a missing cityIds as empty', () => {
    const legacy = { ...baseOpts, cityIds: undefined as unknown as string[] };
    expect(() => isMinorChange(legacy, { ...baseOpts, cityIds: [] })).not.toThrow();
    expect(isMinorChange(legacy, { ...baseOpts, cityIds: [] })).toBe(true);
    expect(serializeOptions(legacy)).toBe(serializeOptions({ ...baseOpts, cityIds: [] }));
  });

  it('toSessionOptions reads cityIds ?? []', () => {
    const sel: TripSuggestion = { id: 1, title: 't', summary: 's', highlights: [] };
    expect(toSessionOptions({ selectedOption: sel, preferences: '' }).cityIds).toEqual([]);
    expect(toSessionOptions({ selectedOption: sel, preferences: '', cityIds: ['rome', 'paris'] }).cityIds).toEqual(['rome', 'paris']);
  });
});
