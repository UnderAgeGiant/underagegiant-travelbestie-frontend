import { isUsernameFormatValid } from './username.util';

describe('isUsernameFormatValid (mirrors backend src/lib/usernames.ts)', () => {
  it.each(['ana', 'ana_perez', 'ana.perez', 'a'.repeat(50)])('accepts %s', u => expect(isUsernameFormatValid(u)).toBe(true));
  it.each(['ab', 'a'.repeat(51), 'Ana', '.ana', 'ana.', 'an..a', 'ana perez', 'añá', ''])('rejects %s', u => expect(isUsernameFormatValid(u)).toBe(false));
});
