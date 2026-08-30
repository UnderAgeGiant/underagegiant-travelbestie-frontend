import { readFileSync } from 'fs';
import { join } from 'path';

const css = readFileSync(join(__dirname, 'styles.css'), 'utf8');

describe('nav drawer stacking (src/styles.css)', () => {
  function zIndexOf(selector: string): number {
    const re = new RegExp(selector.replace(/[.]/g, '\\.') + '\\s*\\{[^}]*z-index:\\s*(\\d+)');
    const match = css.match(re);
    if (!match) throw new Error(`selector not found: ${selector}`);
    return Number(match[1]);
  }

  it('gives the mobile drawer/backdrop a page-independent z-index above every known page overlay', () => {
    // Highest page-level z-indices currently in styles.css: .shared-body (210),
    // .ai-plan-page (200 — its own base rule; the nested .ai-loading-overlay
    // is what sits at 300), .profile-page (350).
    expect(zIndexOf('.nav-m-drawer')).toBeGreaterThan(350);
    expect(zIndexOf('.nav-m-backdrop')).toBeGreaterThan(350);
    expect(zIndexOf('.nav-m-drawer')).toBeGreaterThan(zIndexOf('.nav-m-backdrop'));
  });
});

describe('shared-page mobile meta text and maps link layout (src/styles.css)', () => {
  it('keeps the shared-page mobile meta text and the maps link on the same row', () => {
    // .itin-item-meta must NOT independently claim width:100% anymore — that's what
    // pushed .itin-link (the 📍 maps button) onto its own line below it. The fix wraps
    // both in one flex row (.itin-item-meta-row) that itself takes the full width.
    const mobileBlock = css.slice(css.indexOf('@media (max-width: 480px)'));
    expect(mobileBlock).toMatch(/\.itin-item-meta-row\s*\{[^}]*width:\s*100%/);
    expect(mobileBlock).not.toMatch(/\.itin-item-meta\s*\{[^}]*width:\s*100%/);
  });
});
