import { applyHead, buildNotFoundHead, buildSharedHead, escapeHtml, type SharedSeoSummary } from './shared-head';

const SITE = 'https://tripilove.com';
const summary = (over: Partial<SharedSeoSummary> = {}): SharedSeoSummary => ({
  id: 'abc', tripName: 'Europa 2026', cities: ['Paris', 'Rome', 'Barcelona'], attractionCount: 12,
  updatedAt: '2026-09-01T00:00:00.000Z', indexable: true, ...over,
});

const SHELL = [
  '<!doctype html><html lang="es-CL"><head>',
  '<title>Tripilove — Planificador de viajes con IA</title>',
  '<meta name="description" content="Default">',
  '<meta property="og:title" content="Default">',
  '<meta property="og:image" content="https://tripilove.com/og-default.png">',
  '<meta name="twitter:title" content="Default">',
  '<script type="application/ld+json" id="tb-jsonld-site">{"@graph":[]}</script>',
  '</head><body></body></html>',
].join('\n');

describe('buildSharedHead', () => {
  it('es-CL: title, description, canonical, OG, Twitter, TouristTrip JSON-LD', () => {
    const { title, head } = buildSharedHead(summary(), 'es-CL', SITE);
    expect(title).toBe('Europa 2026 — itinerario en Tripilove');
    expect(head).toContain('<link rel="canonical" href="https://tripilove.com/shared/abc">');
    expect(head).toContain('<meta property="og:url" content="https://tripilove.com/shared/abc">');
    expect(head).toContain('<meta property="og:locale" content="es_CL">');
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(head).toContain('Itinerario por Paris, Rome y Barcelona con 12 atracciones planificadas');
    const ld = JSON.parse(/<script type="application\/ld\+json" id="tb-jsonld-shared">([\s\S]*?)<\/script>/.exec(head)![1]);
    expect(ld['@type']).toBe('TouristTrip');
    expect(ld.itinerary.itemListElement.map((i: any) => i.item.name)).toEqual(['Paris', 'Rome', 'Barcelona']);
    expect(head).not.toContain('noindex');
  });

  it('en-US copy', () => {
    const { title, head } = buildSharedHead(summary(), 'en-US', SITE);
    expect(title).toBe('Europa 2026 — itinerary on Tripilove');
    expect(head).toContain('Itinerary through Paris, Rome, and Barcelona with 12 planned attractions');
  });

  it('adds noindex,follow for a thin plan', () => {
    expect(buildSharedHead(summary({ indexable: false }), 'es-CL', SITE).head)
      .toContain('<meta name="robots" content="noindex,follow">');
  });

  it('escapes hostile trip names in attributes and JSON-LD', () => {
    const { head } = buildSharedHead(summary({ tripName: '"><script>alert(1)</script>' }), 'es-CL', SITE);
    expect(head).not.toContain('<script>alert(1)');
    expect(head).not.toContain('"><script>');
  });

  it('never includes owner fields (they are not in the summary type)', () => {
    expect(buildSharedHead(summary(), 'es-CL', SITE).head).not.toMatch(/owner/i);
  });
});

describe('applyHead', () => {
  it('strips the shell defaults, injects the new head, keeps unrelated tags', () => {
    const { head } = buildSharedHead(summary(), 'es-CL', SITE);
    const out = applyHead(SHELL, head);
    expect(out.match(/<title>/g)).toHaveLength(1);
    expect(out).toContain('<title>Europa 2026 — itinerario en Tripilove</title>');
    expect(out.match(/name="description"/g)).toHaveLength(1);
    expect(out.match(/property="og:title"/g)).toHaveLength(1);
    expect(out.match(/property="og:image"/g)).toHaveLength(1);
    expect(out).toContain('id="tb-jsonld-site"');
  });

  it('is safe against "$&"-style sequences in the head (function replacer)', () => {
    const out = applyHead(SHELL, '<title>Cost $& $1 $$</title>');
    expect(out).toContain('<title>Cost $& $1 $$</title>');
  });
});

describe('buildNotFoundHead', () => {
  it('is a noindex head', () => {
    const head = buildNotFoundHead('en-US');
    expect(head).toContain('Trip not found | Tripilove');
    expect(head).toContain('<meta name="robots" content="noindex,follow">');
  });
});

describe('escapeHtml', () => {
  it('escapes & " < >', () => expect(escapeHtml(`a&b"c<d>`)).toBe('a&amp;b&quot;c&lt;d&gt;'));
});
