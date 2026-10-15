import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CITY_GUIDES } from '../../data/city-guides.data';
import { GUIDE_CONTINENT_ORDER, continentForCity, guideContinentLabel } from '../../core/seo/guide-continent.util';

/** Footer picks per continent: these first (if reviewed), then the rest of that continent in manifest order. */
const FOOTER_PRIORITY = ['rio-de-janeiro', 'buenos-aires', 'cusco', 'lima', 'santiago', 'cartagena-de-indias',
  'nueva-york', 'miami', 'ciudad-de-mexico',
  'paris', 'londres', 'roma', 'madrid', 'barcelona',
  'tokio', 'singapur', 'sidney', 'auckland'];
const FOOTER_PER_CONTINENT = 3;

@Component({
  selector: 'tb-app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'landing-snap-child landing-footer' },
  template: `
<footer class="landing-footer-inner">

  <div class="landing-footer-brand">
    <div class="landing-footer-logo">
      Tripi<em>love</em>
    </div>
    <p class="landing-footer-tagline">
      <button type="button" class="landing-footer-tagline-word" data-word="planifica" (click)="createPlan.emit()" i18n="@@landing.footerTaglinePlanifica">Planifica.</button>
      <button type="button" class="landing-footer-tagline-word" data-word="comparte" (click)="viewMyTrips.emit()" i18n="@@landing.footerTaglineComparte">Comparte.</button>
      <button type="button" class="landing-footer-tagline-word" data-word="explora" (click)="exploreFeatured.emit()" i18n="@@landing.footerTaglineExplora">Explora.</button>
    </p>
  </div>

  <nav class="landing-footer-nav" aria-label="Footer navigation">
    <div class="landing-footer-col">
      <h3 class="landing-footer-col-head" i18n="@@landing.footerColApp">Aplicación</h3>
      <a class="landing-footer-link" href="/" i18n="@@landing.footerLinkExplore">Explorar</a>
      <a class="landing-footer-link" href="/" i18n="@@landing.footerLinkMyTrips">Mis viajes</a>
      <a class="landing-footer-link" href="/" i18n="@@landing.footerLinkShared">Compartidos</a>
    </div>
    <div class="landing-footer-col">
      <h3 class="landing-footer-col-head" i18n="@@landing.footerColAbout">Nosotros</h3>
      <a class="landing-footer-link" routerLink="/about" i18n="@@landing.footerLinkAbout">Sobre Tripilove</a>
    </div>
    <div class="landing-footer-col">
      <h3 class="landing-footer-col-head" i18n="@@landing.footerColLegal">Legal</h3>
      <a class="landing-footer-link" routerLink="/privacy" i18n="@@landing.footerLinkPrivacy">Política de privacidad</a>
      <a class="landing-footer-link" routerLink="/terms"   i18n="@@landing.footerLinkTerms">Términos de servicio</a>
    </div>
    @if (showGuides() && guideBlocks.length) {
      <div class="landing-footer-col">
        <h3 class="landing-footer-col-head" i18n="@@landing.footerGuides">Guías de destinos</h3>
        @for (b of guideBlocks; track b.continent) {
          <div class="landing-footer-continent" [attr.data-continent]="b.continent">
            <a class="landing-footer-continent-head" routerLink="/guides" [fragment]="b.continent">{{ b.label }}</a>
            @for (g of b.guides; track g.slug) {
              <a class="landing-footer-link" [routerLink]="['/ciudad', g.slug]">{{ g.displayName }}</a>
            }
          </div>
        }
        <a class="landing-footer-link landing-footer-all-guides" routerLink="/guides" i18n="@@landing.footerAllGuides">Ver todas las guías</a>
      </div>
    }
  </nav>

  <div class="landing-footer-copy">
    <span i18n="@@landing.footerCopy">© 2026 Tripilove. Hecho con 💜 para aventureros.</span>
  </div>

</footer>
  `,
})
export class AppFooterComponent {
  readonly createPlan = output<void>();
  readonly viewMyTrips = output<void>();
  readonly exploreFeatured = output<void>();
  readonly showGuides = input(true);

  protected readonly guideBlocks = GUIDE_CONTINENT_ORDER.map(continent => {
    const inContinent = CITY_GUIDES.filter(g => g.reviewed && continentForCity(g.cityId) === continent);
    const rank = (slug: string) => { const i = FOOTER_PRIORITY.indexOf(slug); return i < 0 ? FOOTER_PRIORITY.length : i; };
    // stable sort: non-priority guides keep manifest order
    const guides = [...inContinent].sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, FOOTER_PER_CONTINENT);
    return { continent, label: guideContinentLabel(continent), guides };
  }).filter(b => b.guides.length);
}
