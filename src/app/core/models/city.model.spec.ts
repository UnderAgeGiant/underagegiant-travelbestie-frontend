import { REGION_LABELS } from './city.model';

describe('REGION_LABELS', () => {
  it('has a label for every region', () => {
    expect(REGION_LABELS['europe']).toBe('Europe');
    expect(REGION_LABELS['asia']).toBe('Asia');
    expect(REGION_LABELS['americas']).toBe('Americas');
    expect(REGION_LABELS['africa']).toBe('Africa');
    expect(REGION_LABELS['oceania']).toBe('Oceania');
  });
});
