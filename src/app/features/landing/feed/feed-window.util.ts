export interface FeedWindow {
  start: number;         // first rendered index (inclusive)
  end: number;           // last rendered index (exclusive)
  topSpacer: number;     // px standing in for items [0, start)
  bottomSpacer: number;  // px standing in for items [end, total)
}

/** Which slice of a fixed-item-height list to actually render around the active item. */
export function computeFeedWindow(total: number, activeIndex: number, itemHeight: number, before = 2, after = 3): FeedWindow {
  if (total <= 0) return { start: 0, end: 0, topSpacer: 0, bottomSpacer: 0 };
  const a = Math.min(Math.max(activeIndex, 0), total - 1);
  const start = Math.max(0, a - before);
  const end = Math.min(total, a + after + 1);
  return { start, end, topSpacer: start * itemHeight, bottomSpacer: (total - end) * itemHeight };
}

/** Index of the item under the viewport's vertical centre; -1 until the feed has reached it.
 *  `hostTop` is `host.getBoundingClientRect().top` — independent of which element is the scroller. */
export function activeIndexFromTop(hostTop: number, itemHeight: number, viewportHeight: number, total: number): number {
  if (total <= 0 || itemHeight <= 0) return -1;
  const offset = viewportHeight / 2 - hostTop;
  if (offset < 0) return -1;
  return Math.min(total - 1, Math.floor(offset / itemHeight));
}
