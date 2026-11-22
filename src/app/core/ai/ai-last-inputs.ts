/**
 * F84: the last AI planning inputs per user (localStorage), so a user who tapped "Notificarme" or closed the tab
 * finds them again. Dependency-free like first-plan-session.ts: NavFacadeService clears them on logout.
 */
export interface AiLastInputs {
  cities: string[];
  duration?: number;
  startDate?: string;   // dd/mm/yyyy
  preferences?: string;
  budget?: string;
  categories?: string[];
}

const PREFIX = 'tb_ai_last_inputs:';

/** dd/mm/yyyy before `today`'s date (time ignored). */
function isPast(dmy: string, today: Date): boolean {
  const [d, m, y] = dmy.split('/').map(Number);
  return new Date(y, m - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/** Null when missing, unreadable or malformed; a start date already past is dropped. */
export function readAiLastInputs(userId: string, today = new Date()): AiLastInputs | null {
  try {
    const v = JSON.parse(localStorage.getItem(PREFIX + userId) ?? 'null') as AiLastInputs | null;
    if (!v || !Array.isArray(v.cities)) return null;
    if (v.startDate && isPast(v.startDate, today)) delete v.startDate;
    return v;
  } catch { return null; }
}

export function writeAiLastInputs(userId: string, v: AiLastInputs): void {
  try { localStorage.setItem(PREFIX + userId, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

/** On logout: a shared browser never shows one account's trip to the next. */
export function clearAiLastInputs(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch { /* storage unavailable */ }
}
