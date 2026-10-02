import { buildShareLink, buildWhatsappUrl, shareTrip } from './share-url.util';

describe('share url helpers', () => {
  it('builds the public share link from a shareId', () => {
    expect(buildShareLink('abc', 'https://tripilove.app')).toBe('https://tripilove.app/shared/abc');
  });

  it('builds a wa.me url with an encoded message + link', () => {
    const url = buildWhatsappUrl('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('Mi Viaje');
    expect(decodeURIComponent(url)).toContain('https://tripilove.app/shared/abc');
  });

  it('shareTrip uses the Web Share API with a structured url field when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    await shareTrip('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Mi Viaje',
      url: 'https://tripilove.app/shared/abc',
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

  it('shareTrip resolves true when the native share completes', async () => {
    Object.assign(navigator, { share: jest.fn().mockResolvedValue(undefined) });
    await expect(shareTrip('Roma', 'abc', 'https://x')).resolves.toBe(true);
  });

  it('shareTrip resolves false when the user cancels the share sheet', async () => {
    Object.assign(navigator, { share: jest.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })) });
    await expect(shareTrip('Roma', 'abc', 'https://x')).resolves.toBe(false);
  });

  it('shareTrip resolves true when it falls back to WhatsApp', async () => {
    Object.assign(navigator, { share: undefined });
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    await expect(shareTrip('Roma', 'abc', 'https://x')).resolves.toBe(true);
    expect(open).toHaveBeenCalled();
  });
});
