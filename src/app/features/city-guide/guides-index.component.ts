import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { AppFooterComponent } from '../landing/app-footer.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { CITY_GUIDES } from '../../data/city-guides.data';
import { GUIDE_CONTINENT_ORDER, continentForCity, guideContinentLabel } from '../../core/seo/guide-continent.util';
import { guideTopPhoto } from '../../core/seo/city-guide-photo.util';
import { guidePath } from '../../core/seo/city-guide-seo.util';

/** T4 (designer feedback 2026-10-08): public index of city guides by continent + the footer (without its guides column). */
@Component({
  selector: 'app-guides-index',
  imports: [NavShellComponent, AppFooterComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="guides-page">
      <app-nav (logoClick)="goHome()" />
      <header class="guides-hero">
        <div class="guides-hero-inner">
          <div class="guides-hero-text">
            <h1 class="guides-title" i18n="@@guides.title">Guías de viaje</h1>
            <p class="guides-lede" i18n="@@guides.lede">Qué ver, cuándo ir y planes reales de viajeros, ciudad por ciudad.</p>
          </div>
          <div class="guides-miel tb-soap-bubble" aria-hidden="true">
            <img src="/Dog-highlight-playfull-1.png" alt="" width="147" height="154" />
          </div>
        </div>
        <nav class="guides-chips" i18n-aria-label="@@guides.jumpNav" aria-label="Ir a un continente">
          @for (s of sections; track s.continent) {
            <button type="button" class="guides-chip" [attr.data-continent]="s.continent" (click)="jumpTo(s.continent)">
              {{ s.label }} <span class="guides-chip-n">{{ s.guides.length }}</span>
            </button>
          }
        </nav>
      </header>
      <main class="guides-main">
        @for (s of sections; track s.continent) {
          <section class="guides-continent" [attr.data-continent]="s.continent" [id]="'guides-' + s.continent">
            <div class="guides-continent-head">
              <h2>{{ s.label }}</h2>
              @if (s.guides.length) { <span class="guides-count" aria-hidden="true">{{ s.guides.length }}</span> }
            </div>
            @if (s.guides.length) {
              <div class="guides-grid">
                @for (g of s.guides; track g.slug) {
                  <a class="guides-card" [routerLink]="g.path">
                    @if (g.imageUrl) { <img [src]="g.imageUrl" alt="" loading="lazy" /> }
                    <span class="guides-card-name">{{ g.name }}</span>
                  </a>
                }
              </div>
            } @else {
              <div class="guides-empty">
                <img src="/Dog-waiting-1.png" alt="" width="34" height="62" />
                <p i18n="@@guides.empty">Guías en construcción</p>
              </div>
            }
          </section>
        }
      </main>
      <tb-app-footer [showGuides]="false"
                     (createPlan)="goHome()"
                     (viewMyTrips)="facade.openMyTrips()"
                     (exploreFeatured)="goHome()" />
    </div>
  `,
})
export class GuidesIndexComponent {
  private readonly router = inject(Router);
  protected readonly facade = inject(NavFacadeService);

  protected readonly sections = GUIDE_CONTINENT_ORDER.map(continent => ({
    continent,
    label: guideContinentLabel(continent),
    guides: CITY_GUIDES
      .filter(g => g.reviewed && continentForCity(g.cityId) === continent)
      .map(g => ({ slug: g.slug, name: g.displayName, path: guidePath(g.slug), imageUrl: guideTopPhoto(g.cityId) })),
  }));

  goHome(): void { this.router.navigate(['/']); }

  /** Chips scroll inside .guides-page (desktop) or the document (≤768px) — scrollIntoView handles both. */
  jumpTo(continent: string): void {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`guides-${continent}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}
