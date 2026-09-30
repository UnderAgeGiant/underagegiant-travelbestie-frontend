import { attractionName, attractionNativeLabel, matchesAttractionQuery } from './attraction-name.util';

const FORBIDDEN = { name: 'Ciudad Prohibida', nameEn: 'Forbidden City', nativeName: '故宫', type: 'Histórico' };
const PRADO = { name: 'Museo del Prado', nameEn: 'Prado Museum', nativeName: 'Museo del Prado', type: 'Museo' };
const LEGACY = { name: 'Torre Eiffel', type: 'Histórico' };

describe('attractionName', () => {
  it('returns the Spanish name for es-CL', () => {
    expect(attractionName(FORBIDDEN, 'es-CL')).toBe('Ciudad Prohibida');
  });
  it('returns the English name for en-US', () => {
    expect(attractionName(FORBIDDEN, 'en-US')).toBe('Forbidden City');
  });
  it('falls back to name for en-US when nameEn is missing or empty', () => {
    expect(attractionName(LEGACY, 'en-US')).toBe('Torre Eiffel');
    expect(attractionName({ ...LEGACY, nameEn: '' }, 'en-US')).toBe('Torre Eiffel');
  });
});

describe('attractionNativeLabel', () => {
  it('returns the native name when it differs from the displayed name', () => {
    expect(attractionNativeLabel(FORBIDDEN, 'es-CL')).toBe('故宫');
    expect(attractionNativeLabel(FORBIDDEN, 'en-US')).toBe('故宫');
  });
  it('returns null when native equals the displayed name (ignoring case and accents)', () => {
    expect(attractionNativeLabel(PRADO, 'es-CL')).toBeNull();
    expect(attractionNativeLabel({ ...PRADO, nativeName: 'MUSEO DEL PRADÓ' }, 'es-CL')).toBeNull();
  });
  it('shows the Spanish native name to an en-US visitor', () => {
    expect(attractionNativeLabel(PRADO, 'en-US')).toBe('Museo del Prado');
  });
  it('returns null when there is no native name', () => {
    expect(attractionNativeLabel(LEGACY, 'es-CL')).toBeNull();
  });
});

describe('matchesAttractionQuery', () => {
  it('matches the Spanish, English and native names and the type', () => {
    expect(matchesAttractionQuery(FORBIDDEN, 'prohibida')).toBe(true);
    expect(matchesAttractionQuery(FORBIDDEN, 'forbidden')).toBe(true);
    expect(matchesAttractionQuery(FORBIDDEN, '故宫')).toBe(true);
    expect(matchesAttractionQuery(FORBIDDEN, 'histor')).toBe(true);
  });
  it('ignores case, accents and surrounding spaces', () => {
    expect(matchesAttractionQuery(FORBIDDEN, '  FORBÍDDEN ')).toBe(true);
  });
  it('matches everything for an empty query', () => {
    expect(matchesAttractionQuery(FORBIDDEN, '   ')).toBe(true);
  });
  it('does not match unrelated text and tolerates missing fields', () => {
    expect(matchesAttractionQuery(FORBIDDEN, 'louvre')).toBe(false);
    expect(matchesAttractionQuery(LEGACY, 'louvre')).toBe(false);
  });
});
