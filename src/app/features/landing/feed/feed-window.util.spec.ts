import { computeFeedWindow, activeIndexFromTop } from './feed-window.util';

describe('computeFeedWindow', () => {
  it('is empty for no items', () => {
    expect(computeFeedWindow(0, 0, 700)).toEqual({ start: 0, end: 0, topSpacer: 0, bottomSpacer: 0 });
  });
  it('windows [active-2, active+3] and spaces the rest at itemHeight each', () => {
    expect(computeFeedWindow(30, 10, 700)).toEqual({ start: 8, end: 14, topSpacer: 8 * 700, bottomSpacer: 16 * 700 });
  });
  it('clamps at the start and the end', () => {
    expect(computeFeedWindow(30, 0, 700)).toEqual({ start: 0, end: 4, topSpacer: 0, bottomSpacer: 26 * 700 });
    expect(computeFeedWindow(30, 29, 700)).toEqual({ start: 27, end: 30, topSpacer: 27 * 700, bottomSpacer: 0 });
  });
  it('clamps an out-of-range active index', () => {
    expect(computeFeedWindow(5, 99, 700).end).toBe(5);
    expect(computeFeedWindow(5, -3, 700).start).toBe(0);
  });
});

describe('activeIndexFromTop', () => {
  it('is -1 before the feed has reached the viewport centre', () => {
    expect(activeIndexFromTop(900, 700, 800, 20)).toBe(-1);     // top below centre (400)
  });
  it('picks the item under the viewport centre', () => {
    expect(activeIndexFromTop(0, 700, 800, 20)).toBe(0);         // centre 400 -> item 0
    expect(activeIndexFromTop(-1000, 700, 800, 20)).toBe(2);     // offset 1400 -> item 2
  });
  it('clamps to the last item and tolerates a zero height', () => {
    expect(activeIndexFromTop(-999999, 700, 800, 20)).toBe(19);
    expect(activeIndexFromTop(0, 0, 800, 20)).toBe(-1);
    expect(activeIndexFromTop(0, 700, 800, 0)).toBe(-1);
  });
});
