import { snapMinutesFromOffset, minutesToHm, DRAG_SNAP_MINUTES } from './day-timeline-drag.util';

describe('day-timeline-drag.util', () => {
  const FIRST_HOUR = 0;
  const LAST_HOUR = 23;
  const PX_PER_HOUR = 46;

  it('snaps a raw pixel offset to the nearest 15-minute mark', () => {
    // 46px = 1 hour, so 23px ≈ 30 minutes; nearest 15-min mark to :30 is :30 itself.
    expect(snapMinutesFromOffset(23, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR)).toBe(9 * 60 + 30 - 9 * 60); // 30 (0h + 30m)
    expect(snapMinutesFromOffset(0, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR)).toBe(0);       // top of the grid → 00:00
    expect(snapMinutesFromOffset(46, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR)).toBe(60);     // exactly 1 hour down → 01:00
  });

  it('rounds a mid-quarter offset to the nearest quarter-hour', () => {
    // 46/4 = 11.5px per 15 minutes; 6px is closest to the first quarter (11.5px → :15), not 0.
    const min = snapMinutesFromOffset(6, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR);
    expect(min % DRAG_SNAP_MINUTES).toBe(0);
  });

  it('clamps to the grid bounds', () => {
    expect(snapMinutesFromOffset(-100, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR)).toBe(FIRST_HOUR * 60);
    expect(snapMinutesFromOffset(100000, FIRST_HOUR, LAST_HOUR, PX_PER_HOUR)).toBe(LAST_HOUR * 60 + 45);
  });

  it('formats total minutes back into HH:mm', () => {
    expect(minutesToHm(0)).toBe('00:00');
    expect(minutesToHm(90)).toBe('01:30');
    expect(minutesToHm(23 * 60 + 45)).toBe('23:45');
  });
});
