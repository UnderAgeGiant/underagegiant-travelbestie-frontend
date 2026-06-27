import { buildShareLink, buildWhatsappUrl, shareTrip } from './share-url.util';

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

  it('shareTrip uses the Web Share API with a structured url field when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    await shareTrip('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Mi Viaje',
      url: 'https://tripilove.app/?share=abc',
    }));
    delete (navigator as any).share;
  });

  it('shareTrip falls back to the WhatsApp web link when Web Share is unavailable', async () => {
    delete (navigator as any).share;
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    await shareTrip('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank',
      'noopener,noreferrer',
    );
    open.mockRestore();
  });
});
