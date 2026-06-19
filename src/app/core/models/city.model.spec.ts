import { REGION_LABELS } from './city.model';

describe('REGION_LABELS', () => {
  it('has a label for every region', () => {
    expect(REGION_LABELS['europe']).toBe('Europa');
    expect(REGION_LABELS['asia']).toBe('Asia');
    expect(REGION_LABELS['americas']).toBe('América');
    expect(REGION_LABELS['africa']).toBe('África');
    expect(REGION_LABELS['oceania']).toBe('Oceanía');
  });
});
