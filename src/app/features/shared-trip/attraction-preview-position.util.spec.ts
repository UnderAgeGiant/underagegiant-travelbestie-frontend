import { previewCardPosition } from './attraction-preview-position.util';

const VIEW = { width: 1200, height: 800 };

describe('previewCardPosition', () => {
  it('places the card 14px below-right of the mouse', () => {
    expect(previewCardPosition(new MouseEvent('mouseenter', { clientX: 100, clientY: 200 }), VIEW)).toEqual({ x: 114, y: 214 });
  });
  it('flips to the left of the mouse near the right edge', () => {
    expect(previewCardPosition(new MouseEvent('mouseenter', { clientX: 1100, clientY: 200 }), VIEW).x).toBe(1114 - 280 - 28);
  });
  it('keeps the card inside the bottom edge', () => {
    expect(previewCardPosition(new MouseEvent('mouseenter', { clientX: 100, clientY: 700 }), VIEW).y).toBe(800 - 320);
  });
  it('anchors a keyboard focus to the right of the focused element', () => {
    const el = document.createElement('span');
    el.getBoundingClientRect = () => ({ right: 300, top: 50 } as DOMRect);
    const focus = new FocusEvent('focus');
    Object.defineProperty(focus, 'target', { value: el });
    expect(previewCardPosition(focus, VIEW)).toEqual({ x: 310, y: 50 });
  });
});
