import { plannedDurationMinutes } from './planned-duration.util';

describe('plannedDurationMinutes', () => {
  it('uses start/end time when both are set', () => {
    expect(plannedDurationMinutes({ startTime: '10:00', endTime: '12:30' }, { estimatedMinutes: 60 })).toBe(150);
  });
  it('falls back to the catalog duration when end time is missing', () => {
    expect(plannedDurationMinutes({ startTime: '10:00', endTime: undefined }, { estimatedMinutes: 90 })).toBe(90);
  });
  it('falls back to 60 when neither end time nor catalog duration exists', () => {
    expect(plannedDurationMinutes({ startTime: '10:00' }, null)).toBe(60);
  });
  it('never returns zero or negative: end ≤ start uses the fallback', () => {
    expect(plannedDurationMinutes({ startTime: '12:00', endTime: '12:00' }, { estimatedMinutes: 45 })).toBe(45);
    expect(plannedDurationMinutes({ startTime: '23:00', endTime: '01:00' }, { estimatedMinutes: 45 })).toBe(45);
  });
});
