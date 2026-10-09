import { buildShareLink, buildWhatsappUrl, shareTrip } from './share-url.util';

describe('share url helpers', () => {
  it('builds the public share link from a shareId', () => {
    expect(buildShareLink('abc', 'https://tripilove.app')).toBe('https://tripilove.app/shared/abc');
  });

  it('builds an api.whatsapp.com/send url (wa.me\'s redirect corrupts emoji into U+FFFD)', () => {
    const url = buildWhatsappUrl('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    expect(url).not.toContain('%EF%BF%BD');
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('🌍');
    expect(text).toContain('Mi Viaje');
    expect(text).toContain('https://tripilove.app/shared/abc');
  });

  it('shareTrip(own=false) uses wording that does not claim authorship', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    await shareTrip('Plan Ajeno', 'abc', 'https://tripilove.app', false);
    const text: string = share.mock.calls[0][0].text;
    expect(text).not.toContain('armé');
    expect(text).toContain('Mira este viaje');
    delete (navigator as any).share;
  });

  it('shareTrip defaults to the own-trip wording', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    (navigator as any).share = share;
    await shareTrip('Mi Viaje', 'abc', 'https://tripilove.app');
    expect(share.mock.calls[0][0].text).toContain('armé');
    delete (navigator as any).share;
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
      expect.stringContaining('https://api.whatsapp.com/send?text='),
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
