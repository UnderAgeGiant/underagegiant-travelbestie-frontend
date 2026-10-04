import { santiagoWeekStart } from './week-start.util';

describe('santiagoWeekStart (mirror of manager src/lib/rankings.ts)', () => {
  it('Sunday 23:59:59 Santiago is still the previous week', () => {
    expect(santiagoWeekStart(new Date('2026-10-05T02:59:59Z'))).toBe('2026-09-28');
  });
  it('Monday 00:00 Santiago starts a new week', () => {
    expect(santiagoWeekStart(new Date('2026-10-05T03:00:00Z'))).toBe('2026-10-05');
  });
  it('winter time (UTC-4)', () => {
    expect(santiagoWeekStart(new Date('2026-07-06T03:59:59Z'))).toBe('2026-06-29');
    expect(santiagoWeekStart(new Date('2026-07-06T04:00:00Z'))).toBe('2026-07-06');
  });
});
