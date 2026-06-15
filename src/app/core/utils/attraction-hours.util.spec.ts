import { getTodayHours, formatHours, formatTodayHours } from './attraction-hours.util';
import { WeeklySchedule } from '../models/comment.model';

const FULL_SCHEDULE: WeeklySchedule = {
  mon: { open: '09:00', close: '17:00' },
  tue: { open: '09:00', close: '17:00' },
  wed: { open: '09:00', close: '17:00' },
  thu: { open: '09:00', close: '17:00' },
  fri: { open: '09:00', close: '17:00' },
  sat: { open: '10:00', close: '14:00' },
  sun: 'closed',
};

describe('getTodayHours', () => {
  it('returns null for null schedule', () => {
    expect(getTodayHours(null)).toBeNull();
  });

  it('returns null for undefined schedule', () => {
    expect(getTodayHours(undefined)).toBeNull();
  });

  it('returns null when today key is absent from schedule', () => {
    const daySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Sunday
    expect(getTodayHours({ mon: { open: '09:00', close: '17:00' } })).toBeNull();
    daySpy.mockRestore();
  });

  it('returns "closed" when today is marked closed', () => {
    const daySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Sunday
    expect(getTodayHours(FULL_SCHEDULE)).toBe('closed');
    daySpy.mockRestore();
  });

  it('returns DayHours object for an open day', () => {
    const daySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday
    expect(getTodayHours(FULL_SCHEDULE)).toEqual({ open: '09:00', close: '17:00' });
    daySpy.mockRestore();
  });
});

describe('formatHours', () => {
  it('formats open/close as "open – close"', () => {
    expect(formatHours({ open: '09:00', close: '18:00' })).toBe('09:00 – 18:00');
  });
});

describe('formatTodayHours', () => {
  it('returns null for null schedule', () => {
    expect(formatTodayHours(null)).toBeNull();
  });

  it('returns "Closed today" for a closed entry', () => {
    const daySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Sunday
    expect(formatTodayHours(FULL_SCHEDULE)).toBe('Cerrado hoy');
    daySpy.mockRestore();
  });

  it('returns formatted string for an open day', () => {
    const daySpy = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(6); // Saturday
    expect(formatTodayHours(FULL_SCHEDULE)).toBe('Abierto 10:00 – 14:00');
    daySpy.mockRestore();
  });
});
