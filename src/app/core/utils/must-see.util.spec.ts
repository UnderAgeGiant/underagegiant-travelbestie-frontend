import { isMustSeeAttraction, sortMustSeeFirst, MUST_SEE_RATING_THRESHOLD } from './must-see.util';

describe('must-see.util', () => {
  it('flags an attraction as must-see at or above the rating threshold', () => {
    expect(isMustSeeAttraction({ rating: MUST_SEE_RATING_THRESHOLD })).toBe(true);
    expect(isMustSeeAttraction({ rating: 5 })).toBe(true);
    expect(isMustSeeAttraction({ rating: MUST_SEE_RATING_THRESHOLD - 0.1 })).toBe(false);
  });

  it('sorts must-see attractions first while preserving relative order within each group', () => {
    const a = { id: 'a', rating: 3.0 };
    const b = { id: 'b', rating: 4.8 };
    const c = { id: 'c', rating: 2.5 };
    const d = { id: 'd', rating: 4.9 };
    expect(sortMustSeeFirst([a, b, c, d]).map(x => x.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('does not mutate the input array', () => {
    const input = [{ id: 'a', rating: 3.0 }, { id: 'b', rating: 4.8 }];
    const original = [...input];
    sortMustSeeFirst(input);
    expect(input).toEqual(original);
  });
});
