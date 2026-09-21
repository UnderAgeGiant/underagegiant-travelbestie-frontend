import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { canonicalUrl, jsonLdText } from './seo.util';

export interface SeoPage {
  title: string;
  description?: string;
  /** App path to canonicalise; defaults to the current router URL. */
  path?: string;
  noindex?: boolean;
  jsonLd?: object;
}

const JSON_LD_ID = 'tb-jsonld';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  /** The head as shipped in index.html (post-build injects locale-specific defaults) — captured once, lazily. */
  private defaults: { title: string; description: string } | null = null;

  apply(page: SeoPage): void {
    const d = this.getDefaults();
    const description = page.description ?? d.description;
    const url = canonicalUrl(environment.siteUrl, page.path ?? this.router.url);

    this.titleSvc.setTitle(page.title);
    if (description) this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    if (description) this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    if (description) this.meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonical(url);

    if (page.noindex) this.meta.updateTag({ name: 'robots', content: 'noindex,follow' });
    else this.meta.removeTag('name="robots"');

    this.setJsonLd(page.jsonLd);
  }

  reset(): void {
    const d = this.getDefaults();
    this.apply({ title: d.title, description: d.description });
  }

  private getDefaults(): { title: string; description: string } {
    if (!this.defaults) {
      this.defaults = {
        title: this.doc.title,
        description: this.doc.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      };
    }
    return this.defaults;
  }

  private setCanonical(href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }

  private setJsonLd(data?: object): void {
    const existing = this.doc.getElementById(JSON_LD_ID);
    if (!data) { existing?.remove(); return; }
    const el = existing ?? this.doc.createElement('script');
    el.id = JSON_LD_ID;
    el.setAttribute('type', 'application/ld+json');
    el.textContent = jsonLdText(data);
    if (!existing) this.doc.head.appendChild(el);
  }
}
