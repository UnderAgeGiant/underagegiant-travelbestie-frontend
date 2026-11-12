import * as fs from 'fs';
import * as path from 'path';

const SRC_APP = path.join(__dirname, '..');
const BUNDLED_CATALOG = /from\s+['"][^'"]*attractions-curated['"]|import\(\s*['"][^'"]*attractions-curated/;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe('no bundled catalog', () => {
  it('no non-spec source file imports the 13 MB curated catalog', () => {
    const offenders = walk(SRC_APP)
      .filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
      .filter(f => BUNDLED_CATALOG.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(SRC_APP, f));
    expect(offenders).toEqual([]);
  });
});
