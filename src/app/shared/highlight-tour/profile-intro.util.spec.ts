import { shouldShowProfileIntro } from './profile-intro.util';
import { HIGHLIGHT_TOURS } from './highlight-tours.config';

describe('public_profile_intro', () => {
  it('only for a logged-in user without a username', () => {
    expect(shouldShowProfileIntro(true, null)).toBe(true);
    expect(shouldShowProfileIntro(true, undefined)).toBe(true);
    expect(shouldShowProfileIntro(true, 'ana')).toBe(false);
    expect(shouldShowProfileIntro(false, null)).toBe(false);
  });
  it('has one bilingual step on the user menu', () => {
    expect(HIGHLIGHT_TOURS.public_profile_intro).toEqual([
      { targetId: 'user-menu-btn', text: { 'es-CL': expect.stringContaining('nombre de usuario'), 'en-US': expect.stringContaining('username') } },
    ]);
  });
});
