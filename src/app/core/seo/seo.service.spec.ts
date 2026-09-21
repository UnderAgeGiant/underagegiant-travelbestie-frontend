import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from './seo.service';
import { environment } from '../../../environments/environment';

const q = (sel: string) => document.head.querySelector(sel);
const content = (sel: string) => q(sel)?.getAttribute('content');

describe('SeoService', () => {
  let seo: SeoService;

  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default description">';
    document.title = 'Default title';
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    seo = TestBed.inject(SeoService);
  });

  it('sets title, description, canonical and social tags', () => {
    seo.apply({ title: 'About', description: 'About us', path: '/about?x=1' });
    expect(document.title).toBe('About');
    expect(content('meta[name="description"]')).toBe('About us');
    expect(content('meta[property="og:title"]')).toBe('About');
    expect(content('meta[property="og:description"]')).toBe('About us');
    expect(content('meta[name="twitter:title"]')).toBe('About');
    expect(q('link[rel="canonical"]')?.getAttribute('href')).toBe(`${environment.siteUrl}/about`);
    expect(content('meta[property="og:url"]')).toBe(`${environment.siteUrl}/about`);
  });

  it('adds robots noindex only while requested', () => {
    seo.apply({ title: 'X', noindex: true });
    expect(content('meta[name="robots"]')).toBe('noindex,follow');
    seo.apply({ title: 'Y' });
    expect(q('meta[name="robots"]')).toBeNull();
  });

  it('writes and then removes a JSON-LD block', () => {
    seo.apply({ title: 'X', jsonLd: { '@type': 'TouristTrip', name: 'T' } });
    expect(JSON.parse(document.getElementById('tb-jsonld')!.textContent!).name).toBe('T');
    seo.apply({ title: 'Y' });
    expect(document.getElementById('tb-jsonld')).toBeNull();
  });

  it('reset() restores the index.html defaults captured at first use', () => {
    seo.apply({ title: 'About', description: 'About us' });
    seo.reset();
    expect(document.title).toBe('Default title');
    expect(content('meta[name="description"]')).toBe('Default description');
  });
});
