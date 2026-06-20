import {
  parseDMY,
  isDateInRange,
  formatEventChip,
  formatEventLong,
} from './event-datetime.util';

describe('parseDMY', () => {
  it('parses a dd/mm/yyyy string to a local Date at midnight', () => {
    const d = parseDMY('19/06/2026')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June = 5
    expect(d.getDate()).toBe(19);
  });

  it('returns null for empty or malformed input', () => {
    expect(parseDMY('')).toBeNull();
    expect(parseDMY('2026-06-19')).toBeNull();
    expect(parseDMY('//')).toBeNull();
  });
});

describe('isDateInRange', () => {
  it('returns true when the date is within [checkIn, checkOut] inclusive', () => {
    expect(isDateInRange('19/06/2026', '18/06/2026', '21/06/2026')).toBe(true);
    expect(isDateInRange('18/06/2026', '18/06/2026', '21/06/2026')).toBe(true);
    expect(isDateInRange('21/06/2026', '18/06/2026', '21/06/2026')).toBe(true);
  });

  it('returns false when the date is before check-in or after check-out', () => {
    expect(isDateInRange('17/06/2026', '18/06/2026', '21/06/2026')).toBe(false);
    expect(isDateInRange('22/06/2026', '18/06/2026', '21/06/2026')).toBe(false);
  });

  it('returns true (no constraint) when the range is incomplete', () => {
    expect(isDateInRange('19/06/2026', '', '')).toBe(true);
    expect(isDateInRange('19/06/2026', '18/06/2026', '')).toBe(true);
  });

  it('returns false when the event date itself is unparseable', () => {
    expect(isDateInRange('', '18/06/2026', '21/06/2026')).toBe(false);
  });
});

describe('formatEventChip', () => {
  it('joins short date and time with a middot', () => {
    expect(formatEventChip('19/06/2026', '21:00')).toBe('📅 19/06 · 21:00');
  });

  it('shows only the date when time is null', () => {
    expect(formatEventChip('19/06/2026', null)).toBe('📅 19/06');
  });

  it('returns null when there is no date', () => {
    expect(formatEventChip(null, '21:00')).toBeNull();
    expect(formatEventChip(undefined, undefined)).toBeNull();
  });
});

describe('formatEventLong', () => {
  it('includes the full dd/mm/yyyy and the time', () => {
    expect(formatEventLong('19/06/2026', '21:00')).toBe('📅 19/06/2026 · 21:00');
  });

  it('omits the time separator when time is null', () => {
    expect(formatEventLong('19/06/2026', null)).toBe('📅 19/06/2026');
  });

  it('returns null when there is no date', () => {
    expect(formatEventLong(null, null)).toBeNull();
  });
});
