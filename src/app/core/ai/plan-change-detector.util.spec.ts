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
