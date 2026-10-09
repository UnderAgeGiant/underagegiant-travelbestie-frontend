import { readFileSync } from 'fs';
import { join } from 'path';

type Unit = { source: string; target?: string };
function units(file: string): Map<string, Unit> {
  const xml = readFileSync(join(__dirname, file), 'utf8');
  const out = new Map<string, Unit>();
  for (const m of xml.matchAll(/<trans-unit id="([^"]+)"[\s\S]*?<\/trans-unit>/g)) {
    out.set(m[1], {
      source: m[0].match(/<source>([\s\S]*?)<\/source>/)?.[1] ?? '',
      target: m[0].match(/<target>([\s\S]*?)<\/target>/)?.[1],
    });
  }
  return out;
}
const placeholders = (s: string) => [...s.matchAll(/<x id="([^"]+)"/g)].map(x => x[1]).sort();

// Source is one {{ loading ? 'Spanish…' : 'Spanish' }} interpolation — keeping it would print Spanish
// to English users, so these targets are intentionally static English. Fix by splitting the
// loading label into its own i18n string, then remove the id from this list.
const STATIC_ENGLISH_OK = new Set(['nav.otpResend', 'nav.resetRequestBtn', 'nav.resetSubmit', 'nav.sendOtpBtn', 'nav.registerSubmit']);

describe('messages.en-US.xlf placeholders', () => {
  const source = units('messages.xlf');
  const en = units('messages.en-US.xlf');

  it('every extracted unit has an English target', () => {
    const missing = [...source.keys()].filter(id => en.get(id)?.target == null);
    expect(missing).toEqual([]);
  });

  it('every English target carries the same <x> placeholders as the extracted source', () => {
    const bad = [...source.entries()]
      .filter(([id]) => !STATIC_ENGLISH_OK.has(id))
      .filter(([id, u]) => en.get(id)?.target != null && placeholders(u.source).join() !== placeholders(en.get(id)!.target!).join())
      .map(([id]) => id);
    expect(bad).toEqual([]);
  });
});
