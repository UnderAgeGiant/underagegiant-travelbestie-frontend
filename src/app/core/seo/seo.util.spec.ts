import { canonicalUrl, truncate, joinList, jsonLdText } from './seo.util';

describe('canonicalUrl', () => {
  it('keeps the bare origin with a trailing slash for the home page', () => {
    expect(canonicalUrl('https://x.com', '/')).toBe('https://x.com/');
    expect(canonicalUrl('https://x.com/', '')).toBe('https://x.com/');
  });
  it('drops query, hash, duplicate and trailing slashes', () => {
    expect(canonicalUrl('https://x.com/', '/about?x=1#y')).toBe('https://x.com/about');
    expect(canonicalUrl('https://x.com', '/shared//abc/')).toBe('https://x.com/shared/abc');
  });
});

describe('truncate', () => {
  it('returns short text untouched (whitespace collapsed)', () => {
    expect(truncate('  hola   mundo ', 50)).toBe('hola mundo');
  });
  it('cuts long text at a word boundary within the limit and adds an ellipsis', () => {
    const out = truncate('uno dos tres cuatro cinco seis siete ocho nueve diez', 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe('joinList', () => {
  it('formats a conjunction in the given locale', () => {
    expect(joinList(['Paris', 'Rome', 'Barcelona'], 'en-US')).toBe('Paris, Rome, and Barcelona');
    expect(joinList(['Paris', 'Rome', 'Barcelona'], 'es-CL')).toBe('Paris, Rome y Barcelona');
    expect(joinList(['Paris'], 'en-US')).toBe('Paris');
  });
});

describe('jsonLdText', () => {
  it('escapes "<" so a value can never close the script tag', () => {
    expect(jsonLdText({ name: '</script><b>' })).not.toContain('</script>');
    expect(JSON.parse(jsonLdText({ name: '</script>' })).name).toBe('</script>');
  });
});
