import { findScrollableAncestor } from './scroll-passthrough.util';

describe('findScrollableAncestor', () => {
  function makeScrollable(): HTMLDivElement {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true });
    el.style.overflowY = 'auto';
    return el;
  }

  afterEach(() => document.body.innerHTML = '');

  it('returns the nearest ancestor with overflow-y auto/scroll and real overflow', () => {
    const scrollable = makeScrollable();
    const middle = document.createElement('div');
    const leaf = document.createElement('div');
    scrollable.appendChild(middle);
    middle.appendChild(leaf);
    document.body.appendChild(scrollable);

    expect(findScrollableAncestor(leaf)).toBe(scrollable);
  });

  it('skips an ancestor whose overflow-y is auto but has nothing to scroll', () => {
    const fakeScrollable = document.createElement('div');
    fakeScrollable.style.overflowY = 'auto';
    Object.defineProperty(fakeScrollable, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(fakeScrollable, 'clientHeight', { value: 100, configurable: true });

    const realScrollable = makeScrollable();
    const leaf = document.createElement('div');

    realScrollable.appendChild(fakeScrollable);
    fakeScrollable.appendChild(leaf);
    document.body.appendChild(realScrollable);

    expect(findScrollableAncestor(leaf)).toBe(realScrollable);
  });

  it('returns null when nothing up the tree is scrollable, including the page itself', () => {
    const leaf = document.createElement('div');
    const parent = document.createElement('div');
    parent.appendChild(leaf);
    document.body.appendChild(parent);

    expect(findScrollableAncestor(leaf)).toBeNull();
  });

  it('returns null for a null element', () => {
    expect(findScrollableAncestor(null)).toBeNull();
  });

  // Regression test — round 7 of family feedback, reported on a real Android Chrome phone as a
  // full regression from round 6 ("nothing happens, no drag or scroll"): .tl-grid-wrap switches
  // to `overflow-y: visible` under the same max-width:768px breakpoint DeviceService uses for
  // isMobile() (src/styles.css), so on a real phone it is NOT itself a scroll container — the
  // whole page scrolls instead. This used to stop before ever considering document.body/
  // documentElement, so it returned null in exactly this situation, silently breaking the scroll
  // passthrough on top of touch-action: none already blocking the browser's own scroll.
  // jsdom doesn't implement `document.scrollingElement` (it's `undefined`, not `documentElement`
  // as in a real browser), so these two tests stand it up manually via `document.documentElement`
  // and a defineProperty override, cleaned up afterward so it can't leak into other tests.
  it('falls back to the page itself when nothing in between scrolls but the whole document does', () => {
    const leaf = document.createElement('div');
    const gridWrap = document.createElement('div'); // mirrors .tl-grid-wrap's mobile override
    gridWrap.style.overflowY = 'visible';
    Object.defineProperty(gridWrap, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(gridWrap, 'clientHeight', { value: 400, configurable: true });
    gridWrap.appendChild(leaf);
    document.body.appendChild(gridWrap);

    const page = document.documentElement;
    Object.defineProperty(page, 'scrollHeight', { value: 5000, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 800, configurable: true });
    Object.defineProperty(document, 'scrollingElement', { value: page, configurable: true });

    try {
      expect(findScrollableAncestor(leaf)).toBe(page);
    } finally {
      delete (page as any).scrollHeight;
      delete (page as any).clientHeight;
      delete (document as any).scrollingElement;
    }
  });

  it('does not fall back to the page when the page itself has nothing to scroll either', () => {
    const leaf = document.createElement('div');
    const gridWrap = document.createElement('div');
    gridWrap.style.overflowY = 'visible';
    gridWrap.appendChild(leaf);
    document.body.appendChild(gridWrap);

    const page = document.documentElement;
    Object.defineProperty(page, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 800, configurable: true });
    Object.defineProperty(document, 'scrollingElement', { value: page, configurable: true });

    try {
      expect(findScrollableAncestor(leaf)).toBeNull();
    } finally {
      delete (page as any).scrollHeight;
      delete (page as any).clientHeight;
      delete (document as any).scrollingElement;
    }
  });
});
