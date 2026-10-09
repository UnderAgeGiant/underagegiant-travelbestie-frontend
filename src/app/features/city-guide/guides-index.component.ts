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
      <main class="guides-main">
        <h1 class="guides-title" i18n="@@guides.title">Guías de viaje</h1>
        @for (s of sections; track s.continent) {
          <section class="guides-continent">
            <h2>{{ s.label }}</h2>
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
              <p class="guides-empty" i18n="@@guides.empty">Guías en construcción</p>
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
}
