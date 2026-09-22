import { UrlSegment } from '@angular/router';
import { cityGuideSlugGuard } from './city-guide.guard';

const seg = (...p: string[]) => p.map(x => new UrlSegment(x, {}));

describe('cityGuideSlugGuard', () => {
  it('matches a manifest slug', () => {
    expect(cityGuideSlugGuard({} as any, seg('ciudad', 'madrid'))).toBe(true);
  });
  it('rejects unknown slugs and malformed paths', () => {
    expect(cityGuideSlugGuard({} as any, seg('ciudad', 'atlantis'))).toBe(false);
    expect(cityGuideSlugGuard({} as any, seg('ciudad'))).toBe(false);
  });
});
