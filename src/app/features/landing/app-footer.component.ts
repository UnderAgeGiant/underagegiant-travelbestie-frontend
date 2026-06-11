import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'tb-app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'landing-snap-child landing-footer' },
  template: `
<footer class="landing-footer-inner">

  <div class="landing-footer-brand">
    <div class="landing-footer-logo">
      Tripi<em>love</em>
    </div>
    <p class="landing-footer-tagline" i18n="@@landing.footerTagline">
      Planifica. Comparte. Explora.
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
      <a class="landing-footer-link" href="#about" i18n="@@landing.footerLinkAbout">Sobre Tripilove</a>
    </div>
    <div class="landing-footer-col">
      <h3 class="landing-footer-col-head" i18n="@@landing.footerColLegal">Legal</h3>
      <a class="landing-footer-link" href="/privacy" i18n="@@landing.footerLinkPrivacy">Política de privacidad</a>
      <a class="landing-footer-link" href="/terms"   i18n="@@landing.footerLinkTerms">Términos de servicio</a>
    </div>
  </nav>

  <div class="landing-footer-copy">
    <span i18n="@@landing.footerCopy">© 2026 Tripilove. Hecho con 💜 para aventureros.</span>
  </div>

</footer>
  `,
})
export class AppFooterComponent {}
