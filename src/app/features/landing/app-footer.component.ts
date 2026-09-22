import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CITY_GUIDES } from '../../data/city-guides.data';

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
    @if (guides.length) {
      <div class="landing-footer-col">
        <h3 class="landing-footer-col-head" i18n="@@landing.footerGuides">Guías de destinos</h3>
        @for (g of guides; track g.slug) {
          <a class="landing-footer-link" [routerLink]="['/ciudad', g.slug]">{{ g.displayName }}</a>
        }
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

  protected readonly guides = CITY_GUIDES.filter(g => g.reviewed);
}
