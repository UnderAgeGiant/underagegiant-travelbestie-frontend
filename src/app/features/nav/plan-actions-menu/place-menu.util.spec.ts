import { placeMenu } from './place-menu.util';

describe('placeMenu', () => {
  const menu = { width: 224, height: 200 };
  const wide = { width: 1280, height: 800 };

  it('sits below the trigger, right-aligned to it', () => {
    expect(placeMenu({ top: 100, bottom: 130, right: 300 }, menu, wide)).toEqual({ top: 134, left: 76 });
  });

  it('flips above the trigger when it would pass the viewport bottom', () => {
    // bottom 700 + gap 4 + height 200 = 904 > 800 - 8 → top = trigger top 670 - 4 - 200
    expect(placeMenu({ top: 670, bottom: 700, right: 300 }, menu, wide)).toEqual({ top: 466, left: 76 });
  });

  it('clamps left to the 8px margin on a 375px viewport', () => {
    expect(placeMenu({ top: 100, bottom: 130, right: 120 }, menu, { width: 375, height: 700 }).left).toBe(8);
  });

  it('clamps top to the margin when flipping would go off the top', () => {
    expect(placeMenu({ top: 60, bottom: 790, right: 300 }, { width: 224, height: 900 }, wide).top).toBe(8);
  });
});
