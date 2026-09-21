import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SeoRouteListener } from './seo-route.listener';
import { aboutSeo, notFoundSeo } from './seo-pages';

@Component({ template: '' })
class Dummy {}

describe('SeoRouteListener', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default description">';
    document.title = 'Default title';
    TestBed.configureTestingModule({
      providers: [provideRouter([
        { path: '', component: Dummy },
        { path: 'about', component: Dummy, data: { seo: aboutSeo } },
        { path: '**', component: Dummy, data: { seo: notFoundSeo } },
      ])],
    });
    TestBed.inject(SeoRouteListener);
  });

  it('applies the route seo, and restores the defaults on a route without one', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/about');
    expect(document.title).toBe(aboutSeo().title);
    await router.navigateByUrl('/');
    expect(document.title).toBe('Default title');
  });

  it('marks unknown routes noindex', async () => {
    await TestBed.inject(Router).navigateByUrl('/does-not-exist');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,follow');
  });
});
