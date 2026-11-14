/**
 * F79 per-tab session keys (sessionStorage). Dependency-free so AuthService and NavFacadeService can use
 * them without importing FirstPlanService (which injects both).
 */
export const SIGNUP_INTENT_KEY = 'tb_signup_intent';
export const AUTO_OPENED_KEY = 'tb_first_plan_auto_opened';
/** Set once this tab's user is seen with the gift available: the profile tour waits for a later session. */
const GIFT_SESSION_KEY = 'tb_first_plan_gift_session';

export function markGiftSession(): void {
  try { sessionStorage.setItem(GIFT_SESSION_KEY, '1'); } catch { /* storage unavailable */ }
}

export function isGiftSession(): boolean {
  try { return sessionStorage.getItem(GIFT_SESSION_KEY) !== null; } catch { return false; }
}

/** On logout: the next account in this tab starts its own first run. */
export function clearFirstPlanSession(): void {
  try { for (const k of [SIGNUP_INTENT_KEY, AUTO_OPENED_KEY, GIFT_SESSION_KEY]) sessionStorage.removeItem(k); } catch { /* storage unavailable */ }
}
