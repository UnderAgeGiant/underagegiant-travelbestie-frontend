export const PREVIEW_CARD_W = 280;
export const PREVIEW_CARD_H = 320;

/** Viewport position for AttractionPreviewPopoverComponent (position: fixed): below-right of the mouse, or right of a focused element; flipped/clamped to stay on screen. */
export function previewCardPosition(e: MouseEvent | FocusEvent, viewport: { width: number; height: number }): { x: number; y: number } {
  let x: number;
  let y: number;
  if (e instanceof MouseEvent) {
    x = e.clientX + 14;
    y = e.clientY + 14;
  } else {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    x = rect.right + 10;
    y = rect.top;
  }
  if (x + PREVIEW_CARD_W > viewport.width) x -= PREVIEW_CARD_W + 28;
  y = Math.min(y, viewport.height - PREVIEW_CARD_H);
  return { x, y };
}
