import { shareRedirectPath } from './share-redirect.util';

describe('shareRedirectPath', () => {
  it('maps ?share=abc to /shared/abc', () => {
    expect(shareRedirectPath('?share=abc123')).toBe('/shared/abc123');
  });

  it('preserves an extra query param like highlight=clone', () => {
    expect(shareRedirectPath('?share=abc&highlight=clone')).toBe('/shared/abc?highlight=clone');
  });

  it('returns null when there is no share param', () => {
    expect(shareRedirectPath('?foo=bar')).toBeNull();
    expect(shareRedirectPath('')).toBeNull();
  });
});
