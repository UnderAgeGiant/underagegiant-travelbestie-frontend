import { getWeatherCodeMeta } from './weather.model';

describe('getWeatherCodeMeta', () => {
  it('maps clear sky (0) to the sun icon', () => {
    expect(getWeatherCodeMeta(0).icon).toBe('☀️');
  });

  it('maps rain codes (61/63/65) to the rain icon', () => {
    expect(getWeatherCodeMeta(61).icon).toBe('🌧️');
    expect(getWeatherCodeMeta(63).icon).toBe('🌧️');
    expect(getWeatherCodeMeta(65).icon).toBe('🌧️');
  });

  it('maps thunderstorm codes (95/96/99) to the storm icon', () => {
    expect(getWeatherCodeMeta(95).icon).toBe('⛈️');
    expect(getWeatherCodeMeta(99).icon).toBe('⛈️');
  });

  it('maps an unrecognized code to a generic fallback icon', () => {
    expect(getWeatherCodeMeta(9999).icon).toBe('🌡️');
  });
});
