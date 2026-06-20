/** Parses a `dd/mm/yyyy` string to a local Date at midnight, or null if malformed. */
export function parseDMY(s: string | null | undefined): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

/**
 * True when `eventDate` falls within [checkIn, checkOut] inclusive.
 * An incomplete range (missing check-in or check-out) imposes no constraint → true.
 * An unparseable event date → false.
 */
export function isDateInRange(
  eventDate: string | null | undefined,
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): boolean {
  const ev = parseDMY(eventDate);
  if (!ev) return false;
  const lo = parseDMY(checkIn);
  const hi = parseDMY(checkOut);
  if (!lo || !hi) return true;
  return ev.getTime() >= lo.getTime() && ev.getTime() <= hi.getTime();
}

/** Short chip label, e.g. "📅 19/06 · 21:00". Null when no date. */
export function formatEventChip(
  date: string | null | undefined,
  time: string | null | undefined,
): string | null {
  if (!date) return null;
  const dm = date.split('/').slice(0, 2).join('/'); // "19/06"
  return time ? `📅 ${dm} · ${time}` : `📅 ${dm}`;
}

/** Long label, e.g. "📅 19/06/2026 · 21:00". Null when no date. */
export function formatEventLong(
  date: string | null | undefined,
  time: string | null | undefined,
): string | null {
  if (!date) return null;
  return time ? `📅 ${date} · ${time}` : `📅 ${date}`;
}
