/**
 * Scroll to and briefly highlight the element whose data-focus-id equals focusId — only if it is
 * (or soon becomes) present. focusId comes from a URL (?focus=), so it is UNTRUSTED: it is only
 * string-compared against ids the page already rendered, never used in a selector, a fetch, or markup,
 * and it never triggers an action (contracts §9).
 * ponytail: polls every intervalMs for tries×intervalMs (default 3 s) to wait for async lists; a
 * MutationObserver would be exact, add one if a page needs longer than that.
 */
export function focusWhenPresent(root: ParentNode, focusId: string | null, tries = 10, intervalMs = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (!focusId) return () => {};
  const attempt = (left: number): void => {
    const el = Array.from(root.querySelectorAll<HTMLElement>('[data-focus-id]'))
      .find(e => e.getAttribute('data-focus-id') === focusId);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('tb-focus-flash');
      timer = setTimeout(() => el.classList.remove('tb-focus-flash'), 2000);
      return;
    }
    if (left > 0) timer = setTimeout(() => attempt(left - 1), intervalMs);
  };
  attempt(tries);
  return () => clearTimeout(timer);
}
