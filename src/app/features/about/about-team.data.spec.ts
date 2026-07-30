import { ABOUT_TEAM } from './about-team.data';

describe('ABOUT_TEAM', () => {
  it('has exactly 4 members, in display order', () => {
    expect(ABOUT_TEAM.map(m => m.id)).toEqual(['yoli', 'mati', 'ceci', 'miel']);
  });

  it('has a non-empty role, name, bio, and emoji for every member', () => {
    for (const member of ABOUT_TEAM) {
      expect(member.role.length).toBeGreaterThan(0);
      expect(member.name.length).toBeGreaterThan(0);
      expect(member.bio.length).toBeGreaterThan(0);
      expect(member.emoji.length).toBeGreaterThan(0);
    }
  });

  it('cycles the accent colour lav / peach / mint / lav', () => {
    expect(ABOUT_TEAM.map(m => m.accent)).toEqual(['lav', 'peach', 'mint', 'lav']);
  });

  it('points every member at their real photo in public/team/', () => {
    expect(ABOUT_TEAM.map(m => m.photo)).toEqual([
      '/team/yoli.jpeg',
      '/team/mati.jpeg',
      '/team/ceci.jpeg',
      '/team/miel.jpeg',
    ]);
  });
});
