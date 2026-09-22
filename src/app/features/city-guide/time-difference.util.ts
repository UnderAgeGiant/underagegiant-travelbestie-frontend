/** UTC offset (minutes) of an IANA zone at an instant, DST-aware, via Intl (no tz database bundled). */
export function utcOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset', hour: 'numeric' }).formatToParts(at);
  const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(raw);
  if (!m || !m[1]) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Hours the destination is ahead of home at `at` (negative = behind). */
export function hoursAheadOf(homeTimeZone: string, destTimeZone: string, at: Date): number {
  return (utcOffsetMinutes(destTimeZone, at) - utcOffsetMinutes(homeTimeZone, at)) / 60;
}

export function timeDifferenceLabel(hours: number): string {
  if (hours === 0) return $localize`:@@cityGuide.timeSame:Misma hora que en Chile`;
  const abs = Math.abs(hours);
  const n = Number.isInteger(abs) ? String(abs) : abs.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  return hours > 0
    ? $localize`:@@cityGuide.timeAhead:${n}:HOURS: h más que en Chile`
    : $localize`:@@cityGuide.timeBehind:${n}:HOURS: h menos que en Chile`;
}
