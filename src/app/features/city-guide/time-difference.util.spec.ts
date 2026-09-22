import { hoursAheadOf, timeDifferenceLabel, utcOffsetMinutes } from './time-difference.util';

const JUL = new Date(Date.UTC(2026, 6, 1, 12));
const JAN = new Date(Date.UTC(2026, 0, 15, 12));
const CL = 'America/Santiago';

describe('utcOffsetMinutes', () => {
  it('reads DST-aware offsets', () => {
    expect(utcOffsetMinutes('Europe/Madrid', JUL)).toBe(120);
    expect(utcOffsetMinutes('Europe/Madrid', JAN)).toBe(60);
    expect(utcOffsetMinutes(CL, JUL)).toBe(-240);
    expect(utcOffsetMinutes(CL, JAN)).toBe(-180);
    expect(utcOffsetMinutes('UTC', JUL)).toBe(0);
  });
});

describe('hoursAheadOf', () => {
  it('Madrid is +6 h in July and +4 h in January relative to Chile', () => {
    expect(hoursAheadOf(CL, 'Europe/Madrid', JUL)).toBe(6);
    expect(hoursAheadOf(CL, 'Europe/Madrid', JAN)).toBe(4);
  });
  it('South American neighbours', () => {
    expect(hoursAheadOf(CL, 'America/Argentina/Buenos_Aires', JUL)).toBe(1);
    expect(hoursAheadOf(CL, 'America/Argentina/Buenos_Aires', JAN)).toBe(0);
    expect(hoursAheadOf(CL, 'America/Lima', JUL)).toBe(-1);
    expect(hoursAheadOf(CL, 'America/Lima', JAN)).toBe(-2);
  });
});

describe('timeDifferenceLabel', () => {
  it('phrases same / ahead / behind relative to Chile', () => {
    expect(timeDifferenceLabel(0)).toBe('Misma hora que en Chile');
    expect(timeDifferenceLabel(6)).toBe('6 h más que en Chile');
    expect(timeDifferenceLabel(-2)).toBe('2 h menos que en Chile');
  });
});
