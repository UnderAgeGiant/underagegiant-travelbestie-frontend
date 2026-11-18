import { buildShareLink, buildWhatsappUrl, shareMessage } from './share-url.util';

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

  it('shareMessage: own trip claims authorship, someone else’s does not', () => {
    expect(shareMessage(true)).toContain('armé');
    expect(shareMessage(false)).not.toContain('armé');
    expect(shareMessage(false)).toContain('Mira este viaje');
  });
});
