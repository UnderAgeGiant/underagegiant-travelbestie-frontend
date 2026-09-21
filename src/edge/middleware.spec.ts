/** @jest-environment node */
import middleware from '../../middleware';

const CRAWLER = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const HUMAN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const req = (path: string, ua: string) =>
  new Request(`https://tripilove.com${path}`, { headers: { 'user-agent': ua } });
const rewriteTarget = (res: Response) => res.headers.get('x-middleware-rewrite');

describe('middleware crawler gate (SEO_SHARED_HEAD)', () => {
  const original = process.env['SEO_SHARED_HEAD'];
  afterEach(() => {
    if (original === undefined) delete process.env['SEO_SHARED_HEAD'];
    else process.env['SEO_SHARED_HEAD'] = original;
  });

  it('flag unset (default OFF): a crawler on /shared/:id gets the normal static shell, not the function', async () => {
    delete process.env['SEO_SHARED_HEAD'];
    const res = await middleware(req('/shared/abc', CRAWLER));
    expect(rewriteTarget(res)).toContain('/index.html');
    expect(rewriteTarget(res)).not.toContain('/api/shared-page');
  });

  it('flag = anything but "on": still OFF', async () => {
    process.env['SEO_SHARED_HEAD'] = 'true';
    const res = await middleware(req('/shared/abc', CRAWLER));
    expect(rewriteTarget(res)).not.toContain('/api/shared-page');
  });

  it('flag = on: a crawler on /shared/:id is rewritten to the function', async () => {
    process.env['SEO_SHARED_HEAD'] = 'on';
    const res = await middleware(req('/shared/abc', CRAWLER));
    expect(rewriteTarget(res)).toContain('/api/shared-page?id=abc');
  });

  it('flag = on: a human still gets the static shell', async () => {
    process.env['SEO_SHARED_HEAD'] = 'on';
    const res = await middleware(req('/shared/abc', HUMAN));
    expect(rewriteTarget(res)).toContain('/index.html');
  });
});
