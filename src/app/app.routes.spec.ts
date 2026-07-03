import { routes } from './app.routes';

describe('app routes', () => {
  it('has a root route and a /shared/:id route', () => {
    const paths = routes.map(r => r.path);
    expect(paths).toContain('');
    expect(paths).toContain('shared/:id');
  });

  it('lazy-loads the shared route via loadComponent', () => {
    const shared = routes.find(r => r.path === 'shared/:id');
    expect(typeof shared?.loadComponent).toBe('function');
  });

  it('keeps a wildcard fallback that redirects to root', () => {
    const wildcard = routes.find(r => r.path === '**');
    expect(wildcard?.redirectTo).toBe('');
  });
});
