export interface Box { top: number; bottom: number; right: number }
export interface Size { width: number; height: number }

/**
 * Fixed-position coordinates for a floating menu under its trigger: right-aligned, flipped above when
 * it would run past the viewport bottom, and clamped inside the viewport by `margin` on every side.
 */
export function placeMenu(trigger: Box, menu: Size, viewport: Size, gap = 4, margin = 8): { top: number; left: number } {
  const below = trigger.bottom + gap;
  const flip = below + menu.height > viewport.height - margin;
  const rawTop = flip ? trigger.top - gap - menu.height : below;
  const left = Math.min(Math.max(trigger.right - menu.width, margin), viewport.width - menu.width - margin);
  return { top: Math.max(rawTop, margin), left };
}
