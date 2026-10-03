import { focusWhenPresent, FLASH_MS, SCROLL_SETTLE_FALLBACK_MS } from './focus-item.util';

describe('focusWhenPresent', () => {
  let root: HTMLDivElement;
  let scroll: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    scroll = jest.fn();
    Element.prototype.scrollIntoView = scroll;
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => { root.remove(); jest.useRealTimers(); });

  function item(id: string): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-focus-id', id);
    root.appendChild(el);
    return el;
  }

  it('scrolls to the matching element, flashes it once the scroll settles, then removes the flash', () => {
    item('other');
    const el = item('r1');
    focusWhenPresent(root, 'r1');
    expect(scroll).toHaveBeenCalledTimes(1);
    // Not yet: a flash that starts with a smooth scroll is spent before the item stops moving.
    expect(el.classList.contains('tb-focus-flash')).toBe(false);
    document.dispatchEvent(new Event('scrollend'));
    expect(el.classList.contains('tb-focus-flash')).toBe(true);
    jest.advanceTimersByTime(FLASH_MS);
    expect(el.classList.contains('tb-focus-flash')).toBe(false);
  });

  it('flashes after a fallback delay when no scroll happens (item already in view)', () => {
    const el = item('r1');
    focusWhenPresent(root, 'r1');
    jest.advanceTimersByTime(SCROLL_SETTLE_FALLBACK_MS);
    expect(el.classList.contains('tb-focus-flash')).toBe(true);
  });

  it('waits for an element that renders after async data arrives', () => {
    focusWhenPresent(root, 'r1');
    expect(scroll).not.toHaveBeenCalled();
    const el = item('r1');
    jest.advanceTimersByTime(300 + SCROLL_SETTLE_FALLBACK_MS);
    expect(el.classList.contains('tb-focus-flash')).toBe(true);
  });

  it('gives up silently when the item never appears', () => {
    focusWhenPresent(root, 'gone');
    jest.advanceTimersByTime(60_000);
    expect(scroll).not.toHaveBeenCalled();
  });

  it.each(['"]),*{x', '<img src=x onerror=alert(1)>', '#r1', '*'])('treats %p as a plain string: no throw, no match, no markup', (bad) => {
    item('r1');
    expect(() => focusWhenPresent(root, bad)).not.toThrow();
    jest.advanceTimersByTime(60_000);
    expect(scroll).not.toHaveBeenCalled();
    expect(root.querySelector('img')).toBeNull();
  });

  it('does nothing for a null or empty id', () => {
    item('');
    focusWhenPresent(root, null);
    focusWhenPresent(root, '');
    jest.advanceTimersByTime(60_000);
    expect(scroll).not.toHaveBeenCalled();
  });

  it('the returned cancel stops pending retries', () => {
    const cancel = focusWhenPresent(root, 'r1');
    cancel();
    item('r1');
    jest.advanceTimersByTime(60_000);
    expect(scroll).not.toHaveBeenCalled();
  });
});
