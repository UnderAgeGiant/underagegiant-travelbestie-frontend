/**
 * Root cause (family feedback, round 6): "drag doesn't work on mobile as it does on desktop".
 *
 * Both AttractionCardComponent's card→grid drag and DayTimelineComponent's block reschedule
 * use a 350ms long-press-to-arm touch gesture (see the CRITICAL comments next to each), and
 * deliberately do NOT call `event.preventDefault()` before the timer fires, so that a plain
 * scroll/tap keeps working when the user isn't trying to drag.
 *
 * That's correct in spirit, but real touch devices decide whether a touch sequence is a native
 * scroll based on the FIRST touchmove event(s) of the gesture — if `event.preventDefault()`
 * isn't called on (approximately) that first move, the browser commits to scrolling for the rest
 * of the gesture, and a later `preventDefault()` call (once our timer fires and we're "armed")
 * is a no-op: the page/list just keeps scrolling under the finger and no drag ever happens. This
 * is invisible to a JS-dispatched synthetic `TouchEvent` test (those only run listener callbacks,
 * they never trigger a real compositor-thread scroll), which is why an earlier round's live test
 * looked fully working but a real phone still couldn't drag.
 *
 * The standard fix is `touch-action: none` on the draggable element, which tells the browser up
 * front — before any touchmove races happen — to never treat touches starting there as a native
 * pan/scroll gesture, leaving 100% of the interpretation to this component's own JS. The
 * trade-off is that native scrolling no longer works for a touch that starts directly on that
 * element, so this helper replays the vertical delta by hand onto the real scrollable ancestor
 * during the pre-armed phase, keeping a plain swipe-to-scroll feeling identical to before.
 */
export function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll')
      && node.scrollHeight > node.clientHeight;
    if (canScrollY) return node;
    node = node.parentElement;
  }
  return null;
}
