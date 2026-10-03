/** Matches the .tb-focus-flash animation in styles.css (3 × 0.8 s pulses). */
export const FLASH_MS = 2400;
/** Flash start when no scrollend arrives (item already in view, or a browser without scrollend). */
export const SCROLL_SETTLE_FALLBACK_MS = 700;

/**
 * Scroll to and briefly highlight the element whose data-focus-id equals focusId — only if it is
 * (or soon becomes) present. focusId comes from a URL (?focus=), so it is UNTRUSTED: it is only
 * string-compared against ids the page already rendered, never used in a selector, a fetch, or markup,
 * and it never triggers an action (contracts §9).
 * The flash starts once the smooth scroll settles: started together with the scroll it was spent
 * before the item stopped moving, so nobody saw it (2026-10-03 owner test).
 * ponytail: polls every intervalMs for tries×intervalMs (default 3 s) to wait for async lists; a
 * MutationObserver would be exact, add one if a page needs longer than that.
 */
export function focusWhenPresent(root: ParentNode, focusId: string | null, tries = 10, intervalMs = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopFlash = (): void => {};
  if (!focusId) return () => {};
  const attempt = (left: number): void => {
    const el = Array.from(root.querySelectorAll<HTMLElement>('[data-focus-id]'))
      .find(e => e.getAttribute('data-focus-id') === focusId);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      stopFlash = flashWhenSettled(el);
      return;
    }
    if (left > 0) timer = setTimeout(() => attempt(left - 1), intervalMs);
  };
  attempt(tries);
  return () => { clearTimeout(timer); stopFlash(); };
}

function flashWhenSettled(el: HTMLElement): () => void {
  let removeTimer: ReturnType<typeof setTimeout> | undefined;
  const start = (): void => {
    cleanup();
    el.classList.add('tb-focus-flash');
    removeTimer = setTimeout(() => el.classList.remove('tb-focus-flash'), FLASH_MS);
  };
  // scrollend doesn't bubble from nested scrollers to document, but it does reach it in the capture phase.
  const fallback = setTimeout(start, SCROLL_SETTLE_FALLBACK_MS);
  const cleanup = (): void => { clearTimeout(fallback); document.removeEventListener('scrollend', start, true); };
  document.addEventListener('scrollend', start, true);
  return () => { cleanup(); clearTimeout(removeTimer); };
}
