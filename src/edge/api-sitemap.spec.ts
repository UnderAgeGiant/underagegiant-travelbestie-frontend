/** @jest-environment node */
import { GET, HEAD, OPTIONS } from '../../api/sitemap';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

function mockBackend(items: { id: string; updatedAt: string }[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items }),
  }) as unknown as typeof fetch;
}

describe('api/sitemap HEAD', () => {
  it('matches GET status, content-type and cache-control, with an empty body', async () => {
    mockBackend([{ id: 'abc', updatedAt: '2026-09-01T00:00:00.000Z' }]);
    process.env['BACKEND_API_URL'] = 'https://api.example.com';

    const getRes = await GET(new Request('https://tripilove.com/sitemap.xml'));
    const headRes = await HEAD(new Request('https://tripilove.com/sitemap.xml'));

    expect(headRes.status).toBe(getRes.status);
    expect(headRes.headers.get('content-type')).toBe(getRes.headers.get('content-type'));
    expect(headRes.headers.get('cache-control')).toBe(getRes.headers.get('cache-control'));
    expect(await headRes.text()).toBe('');
  });

  it('still 200s with an empty body when the backend is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch;
    process.env['BACKEND_API_URL'] = 'https://api.example.com';

    const res = await HEAD(new Request('https://tripilove.com/sitemap.xml'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    expect(await res.text()).toBe('');
  });
});

describe('api/sitemap OPTIONS', () => {
  it('returns 204 and advertises GET, HEAD, OPTIONS', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('GET, HEAD, OPTIONS');
    expect(await res.text()).toBe('');
  });
});
