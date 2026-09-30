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

/** Touch variant: card centred horizontally under the tap point, 12px from every screen edge. */
export function previewCardTapPosition(clientX: number, clientY: number, viewport: { width: number; height: number }): { x: number; y: number } {
  return {
    x: Math.max(12, Math.min(clientX - PREVIEW_CARD_W / 2, viewport.width - PREVIEW_CARD_W - 12)),
    y: Math.min(clientY + 16, viewport.height - PREVIEW_CARD_H - 12),
  };
}
