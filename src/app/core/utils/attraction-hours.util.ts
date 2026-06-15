import { DayHours, WeekDay, WeeklySchedule } from '../models/comment.model';

const WEEKDAY_KEYS: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Returns the WeekDay key for today (browser-local). */
export function getTodayKey(): WeekDay {
  return WEEKDAY_KEYS[new Date().getDay()];
}

/** Returns today's hours entry, or null if schedule is absent/unknown. */
export function getTodayHours(schedule: WeeklySchedule | null | undefined): DayHours | 'closed' | null {
  if (!schedule) return null;
  const key = getTodayKey();
  const entry = schedule[key];
  return entry !== undefined ? entry : null;
}

/** Formats a DayHours object as "09:00 – 17:00". */
export function formatHours(hours: DayHours): string {
  return `${hours.open} – ${hours.close}`;
}

/** Human-readable summary of today's status: "Open 09:00 – 17:00" / "Closed today" / null. */
export function formatTodayHours(schedule: WeeklySchedule | null | undefined): string | null {
  const entry = getTodayHours(schedule);
  if (entry === null) return null;
  if (entry === 'closed') return 'Closed today';
  return `Open ${formatHours(entry)}`;
}
