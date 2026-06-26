import { buildShareLink, buildWhatsappUrl } from './share-url.util';

describe('share url helpers', () => {
  it('builds the public share link from a shareId', () => {
    expect(buildShareLink('abc', 'https://tripilove.app')).toBe('https://tripilove.app/?share=abc');
  });

  it('builds a wa.me url with an encoded message + link', () => {
    const url = buildWhatsappUrl('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('Mi Viaje');
    expect(decodeURIComponent(url)).toContain('https://tripilove.app/?share=abc');
  });
});
