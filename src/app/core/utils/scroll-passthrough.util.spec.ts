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

  it('returns null when nothing up the tree is scrollable', () => {
    const leaf = document.createElement('div');
    const parent = document.createElement('div');
    parent.appendChild(leaf);
    document.body.appendChild(parent);

    expect(findScrollableAncestor(leaf)).toBeNull();
  });

  it('returns null for a null element', () => {
    expect(findScrollableAncestor(null)).toBeNull();
  });
});
