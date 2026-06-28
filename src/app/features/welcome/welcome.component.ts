import { Component, output, signal, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { BackgroundSliderComponent, SLIDES } from '../../shared/background-slider/background-slider.component';

@Component({
    selector: 'app-welcome',
    imports: [BackgroundSliderComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <app-background-slider
      [activeIdx]="slideIdx()"
      (prev)="prevSlide()"
      (next)="nextSlide()"
      (dotClick)="slideIdx.set($event)" />

    <div class="welcome-overlay">
      <div class="welcome-content">
        <div class="welcome-eyebrow" i18n="@@welcome.eyebrow">Planifica · Comparte · Explora</div>
        <h1 class="welcome-title" i18n="@@welcome.title">Viaja pensando en tu<br/><em>mejor amig&#64;</em></h1>
        <p class="welcome-sub" i18n="@@welcome.subtitle">Crea viajes a múltiples destinos, descubre atracciones locales y deja que tus amigos comenten cada parada.</p>
        <div class="welcome-ctas">
          <button class="welcome-cta welcome-cta-primary" (click)="addDestination.emit()"
                  i18n="@@welcome.ctaCreatePlan">Crear Plan</button>
          <button class="welcome-cta welcome-cta-ai" (click)="openAiPlanning.emit()"
                  i18n="@@welcome.ctaCreateAi">✨ Crear con IA</button>
          <button class="welcome-cta welcome-cta-karma" (click)="howKarmaOpen.set(true)"
                  i18n="@@welcome.ctaHowKarma">⭐ Cómo ganar Karma</button>
        </div>

        @if (howKarmaOpen()) {
          <div class="welcome-karma-modal-backdrop" (click)="howKarmaOpen.set(false)">
            <div class="welcome-karma-modal" (click)="$event.stopPropagation()">
              <h3 i18n="@@welcome.karmaTitle">Cómo ganar Karma ⭐</h3>
              <p i18n="@@welcome.karmaBody">Gana Karma cuando tus amigos comentan las paradas de tus viajes compartidos. Úsalo para clonar viajes, exportar itinerarios y planificar con IA.</p>
              <button class="btn-pill btn-primary" (click)="howKarmaOpen.set(false)"
                      i18n="@@welcome.karmaClose">Entendido</button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class WelcomeComponent implements OnInit, OnDestroy {
  addDestination = output<void>();
  openAiPlanning = output<void>();
  slideIdx = signal(0);
  readonly slides = SLIDES;
  readonly howKarmaOpen = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  prevSlide() { this.slideIdx.update(i => (i - 1 + this.slides.length) % this.slides.length); }
  nextSlide() { this.slideIdx.update(i => (i + 1) % this.slides.length); }

  ngOnInit() {
    this.timer = setInterval(() => this.slideIdx.update(i => (i + 1) % this.slides.length), 5000);
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
