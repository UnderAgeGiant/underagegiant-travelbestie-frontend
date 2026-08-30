import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { InViewDirective } from '../../shared/directives/in-view.directive';
import { ABOUT_TEAM, AboutTeamMember } from './about-team.data';
import { getInitials } from './about-initials.util';

const FORWARD_PATH = 'M60,20 C 220,20 260,100 400,100 S 560,20 590,20';
const REVERSE_PATH = 'M590,20 C 430,20 390,100 250,100 S 90,20 60,20';
const PLANE_ICON_PATH = 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z';

interface AboutConnector {
  path: string;
  offsetPath: string;
  color: string;
  endLeft: string;
}

const CONNECTORS: AboutConnector[] = [
  { path: FORWARD_PATH, offsetPath: `path('${FORWARD_PATH}')`, color: 'var(--lav-d)',   endLeft: 'calc(590px/640*100% - 11px)' },
  { path: REVERSE_PATH, offsetPath: `path('${REVERSE_PATH}')`, color: 'var(--peach-d)', endLeft: 'calc(60px/640*100% - 11px)' },
  { path: FORWARD_PATH, offsetPath: `path('${FORWARD_PATH}')`, color: 'var(--mint-d)',  endLeft: 'calc(590px/640*100% - 11px)' },
];

@Component({
  selector: 'app-about',
  imports: [NavShellComponent, ProfileComponent, RouterLink, InViewDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about-page">
      <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)"
                     (openMyTrips)="showProfile.set(false)" />
      }

      <header class="about-hero">
        <div class="about-hero-eyebrow" i18n="@@about.hero.eyebrow">Sobre nosotros</div>
        <h1 class="about-hero-title" i18n="@@about.hero.title">Las <em>besties</em> detrás<br>del viaje</h1>
        <p class="about-hero-sub" i18n="@@about.hero.sub">Cuatro personas, una idea: planificar un viaje debería sentirse como una aventura, no como una planilla de cálculo.</p>
      </header>

      <section class="about-journey">
        <div class="about-journey-head">
          <div class="about-journey-label" i18n="@@about.journey.label">Nuestra historia, una parada a la vez</div>
          <p class="about-journey-sub" i18n="@@about.journey.sub">Sigue la ruta de vuelo — cada parada presenta a alguien que ayudó a construir Tripilove.</p>
        </div>

        @for (member of team; track member.id; let i = $index; let isOdd = $odd) {
          <div class="about-step" [class.reverse]="isOdd">
            <div class="about-step-media">
              <div class="about-step-photo-frame">
                @if (member.photo) {
                  <img [src]="member.photo" [alt]="member.name" class="about-step-photo">
                } @else {
                  <div class="about-step-photo-placeholder" [attr.data-accent]="member.accent">{{ initials(member) }}</div>
                }
              </div>
              <div class="about-step-badge">{{ member.emoji }}</div>
              <div class="about-step-num">{{ i + 1 }}</div>
            </div>
            <div class="about-step-body">
              <div class="about-step-role">{{ member.role }}</div>
              <div class="about-step-name">{{ member.name }}</div>
              <p class="about-step-text">{{ member.bio }}</p>
            </div>
          </div>

          @if (i < team.length - 1) {
            <div class="about-connector" tbInView>
              <svg class="about-path-bg" viewBox="0 0 640 120" preserveAspectRatio="none">
                <path pathLength="100" [attr.d]="connectors[i].path"></path>
              </svg>
              <svg class="about-plane" viewBox="0 0 24 24" [style.offset-path]="connectors[i].offsetPath" [style.color]="connectors[i].color">
                <path [attr.d]="planeIconPath" fill="currentColor"></path>
              </svg>
              <svg class="about-plane-end" viewBox="0 0 24 24" [style.left]="connectors[i].endLeft" [style.color]="connectors[i].color">
                <path [attr.d]="planeIconPath" fill="currentColor"></path>
              </svg>
            </div>
          }
        }
      </section>

      <section class="about-closing">
        <div class="about-closing-title" i18n="@@about.closing.title">¿Listo para planificar tu próximo viaje?</div>
        <p class="about-closing-sub" i18n="@@about.closing.sub">Únete a miles de besties que arman itinerarios juntos, un destino a la vez.</p>
        <a class="btn-pill btn-primary about-closing-cta" routerLink="/" i18n="@@about.closing.cta">Comenzar a planificar ✈️</a>
      </section>
    </div>
  `,
})
export class AboutComponent {
  private readonly router = inject(Router);

  readonly team = ABOUT_TEAM;
  readonly connectors = CONNECTORS;
  readonly planeIconPath = PLANE_ICON_PATH;
  readonly showProfile = signal(false);

  initials(member: AboutTeamMember): string {
    return getInitials(member.name);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
