/** 'YYYY-MM-DD' of the Monday starting `now`'s week in America/Santiago. Keep identical to the manager's src/lib/rankings.ts. */
export function santiagoWeekStart(now: Date = new Date()): string {
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const d = new Date(`${local}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
