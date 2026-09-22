/** @jest-environment node */
import { GET, HEAD, OPTIONS } from '../../api/shared-page';

const SHELL = '<!doctype html><html lang="es-CL"><head><title>Tripilove</title></head><body></body></html>';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

function mockShellAnd(backendRes: { status: number; ok: boolean; json?: () => Promise<unknown> }) {
  global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/index')) return Promise.resolve({ ok: true, text: async () => SHELL });
    return Promise.resolve(backendRes);
  }) as unknown as typeof fetch;
}

describe('api/shared-page HEAD', () => {
  beforeEach(() => { process.env['BACKEND_API_URL'] = 'https://api.example.com'; });

  it('a real plan: HEAD matches GET status/content-type/cache-control with an empty body', async () => {
    mockShellAnd({
      status: 200, ok: true,
      json: async () => ({
        id: 'abc', tripName: 'Europa 2026', cities: ['Paris'], attractionCount: 5,
        updatedAt: '2026-09-01T00:00:00.000Z', indexable: true,
      }),
    });

    const req = () => new Request('https://tripilove.com/api/shared-page?id=abc&loc=es-CL');
    const getRes = await GET(req());
    const headRes = await HEAD(req());

    expect(headRes.status).toBe(200);
    expect(headRes.status).toBe(getRes.status);
    expect(headRes.headers.get('content-type')).toBe(getRes.headers.get('content-type'));
    expect(headRes.headers.get('cache-control')).toBe(getRes.headers.get('cache-control'));
    expect(await headRes.text()).toBe('');
  });

  it('a 404 (unknown share id): HEAD matches GET 404 with an empty body', async () => {
    mockShellAnd({ status: 404, ok: false });

    const req = () => new Request('https://tripilove.com/api/shared-page?id=nope&loc=es-CL');
    const getRes = await GET(req());
    const headRes = await HEAD(req());

    expect(headRes.status).toBe(404);
    expect(headRes.status).toBe(getRes.status);
    expect(headRes.headers.get('content-type')).toBe(getRes.headers.get('content-type'));
    expect(await headRes.text()).toBe('');
  });
});

describe('api/shared-page OPTIONS', () => {
  it('returns 204 and advertises GET, HEAD, OPTIONS', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('GET, HEAD, OPTIONS');
    expect(await res.text()).toBe('');
  });
});
