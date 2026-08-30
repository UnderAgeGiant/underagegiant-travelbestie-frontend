import { readFileSync } from 'fs';
import { join } from 'path';

describe('nav drawer stacking (src/styles.css)', () => {
  const css = readFileSync(join(__dirname, 'styles.css'), 'utf8');

  function zIndexOf(selector: string): number {
    const re = new RegExp(selector.replace(/[.]/g, '\\.') + '\\s*\\{[^}]*z-index:\\s*(\\d+)');
    const match = css.match(re);
    if (!match) throw new Error(`selector not found: ${selector}`);
    return Number(match[1]);
  }

  it('gives the mobile drawer/backdrop a page-independent z-index above every known page overlay', () => {
    // Highest page-level z-indices currently in styles.css: .shared-body (210),
    // .ai-plan-page (~300 via its own base rule), .profile-page (350).
    expect(zIndexOf('.nav-m-drawer')).toBeGreaterThan(350);
    expect(zIndexOf('.nav-m-backdrop')).toBeGreaterThan(350);
    expect(zIndexOf('.nav-m-drawer')).toBeGreaterThan(zIndexOf('.nav-m-backdrop'));
  });
});
