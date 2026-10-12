import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { routes } from './app.routes';
import { authGuard } from './core/auth/auth.guard';
import { landingGuard } from './features/shell/landing.guard';

describe('app routes', () => {
  it('has a root route, an /about route, and a /shared/:id route', () => {
    const paths = routes.map(r => r.path);
    expect(paths).toContain('');
    expect(paths).toContain('about');
    expect(paths).toContain('shared/:id');
  });

  it('lazy-loads the shared route via loadComponent', () => {
    const shared = routes.find(r => r.path === 'shared/:id');
    expect(typeof shared?.loadComponent).toBe('function');
  });

  it('lazy-loads the about route via loadComponent', () => {
    const about = routes.find(r => r.path === 'about');
    expect(typeof about?.loadComponent).toBe('function');
  });

  it('keeps a wildcard fallback that renders the Not Found page (no redirect)', () => {
    const wildcard = routes.find(r => r.path === '**');
    expect(wildcard?.redirectTo).toBeUndefined();
    expect(typeof wildcard?.loadComponent).toBe('function');
    expect(typeof wildcard?.data?.['seo']).toBe('function');
  });

  it.each(['plan', 'preferences', 'my-trips', 'ai-planning'])('has a lazy, noindex /%s route (English path)', path => {
    const route = routes.find(r => r.path === path);
    expect(typeof route?.loadComponent).toBe('function');
    expect(route?.data?.['seo']().noindex).toBe(true);
  });

  it('marks /plan as the editor', () => {
    expect(routes.find(r => r.path === 'plan')?.data?.['mode']).toBe('editor');
  });

  it('the landing route carries mode=landing and the first-navigation landingGuard', () => {
    const root = routes.find(r => r.path === '');
    expect(root?.data?.['mode']).toBe('landing');
    expect(root?.canActivate).toEqual([landingGuard]);
  });

  it('redirects the old /profile path to /preferences', () => {
    expect(routes.find(r => r.path === 'profile')?.redirectTo).toBe('preferences');
  });

  it('guards /preferences and /my-trips; /plan and /ai-planning stay open to anonymous visitors', () => {
    expect(routes.find(r => r.path === 'preferences')?.canActivate).toEqual([authGuard]);
    expect(routes.find(r => r.path === 'my-trips')?.canActivate).toEqual([authGuard]);
    expect(routes.find(r => r.path === 'plan')?.canActivate).toBeUndefined();
    expect(routes.find(r => r.path === 'ai-planning')?.canActivate).toBeUndefined();
  });
});

describe('Feature 68 — preferences is a route, not an overlay', () => {
  function componentFiles(dir: string): string[] {
    return readdirSync(dir).flatMap(f => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? componentFiles(p) : p.endsWith('.component.ts') ? [p] : [];
    });
  }

  it('only PreferencesPageComponent renders <app-preferences>', () => {
    const offenders = componentFiles(join(__dirname, 'features'))
      .filter(f => !f.endsWith('preferences-page.component.ts'))
      .filter(f => readFileSync(f, 'utf8').includes('<app-preferences'));
    expect(offenders).toEqual([]);
  });
});

describe('/profile → /preferences redirect', () => {
  it('keeps the query params and fragment of backend-issued notification urls', async () => {
    @Component({ template: '' }) class Blank {}
    TestBed.configureTestingModule({
      providers: [provideRouter([routes.find(r => r.path === 'profile')!, { path: 'preferences', component: Blank }])],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/profile?focus=ai_plans%3Abronze#trofeos');
    const tree = router.parseUrl(router.url);
    expect(tree.root.children['primary'].segments.map(s => s.path)).toEqual(['preferences']);
    expect(tree.queryParams).toEqual({ focus: 'ai_plans:bronze' });
    expect(tree.fragment).toBe('trofeos');
  });
});
