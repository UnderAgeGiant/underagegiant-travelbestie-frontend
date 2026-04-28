import { Component, output, signal, OnInit, OnDestroy } from '@angular/core';
import { BackgroundSliderComponent, SLIDES } from '../../shared/background-slider/background-slider.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [BackgroundSliderComponent],
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
        <div class="welcome-actions">
          <button class="btn-pill btn-primary"
                  style="padding:11px 24px;font-size:14px"
                  (click)="addDestination.emit()"
                  i18n="@@welcome.addBtn">+ Agregar destino</button>
        </div>
        <div class="welcome-steps">
          @for (step of steps; track step.n) {
            <div class="step-card">
              <div class="step-num">{{ step.n }}</div>
              <div class="step-title">{{ step.t }}</div>
              <div class="step-desc">{{ step.d }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WelcomeComponent implements OnInit, OnDestroy {
  addDestination = output<void>();
  slideIdx = signal(0);
  readonly slides = SLIDES;
  private timer?: ReturnType<typeof setInterval>;

  readonly steps = [
    { n: 1, t: $localize`:@@welcome.step1Title:Elige una ciudad`,       d: $localize`:@@welcome.step1Desc:120+ destinos en el mundo` },
    { n: 2, t: $localize`:@@welcome.step2Title:Explorar atracciones`,    d: $localize`:@@welcome.step2Desc:Lugares seleccionados para ver y hacer` },
    { n: 3, t: $localize`:@@welcome.step3Title:Recopilar comentarios`,   d: $localize`:@@welcome.step3Desc:Tus amigos dejan consejos en cada parada` },
    { n: 4, t: $localize`:@@welcome.step4Title:Comparte tu viaje 🔗`,    d: $localize`:@@welcome.step4Desc:Genera un enlace público de tu plan y compártelo con tus amigos` },
    { n: 5, t: $localize`:@@welcome.step5Title:Gana Karma ⭐`,           d: $localize`:@@welcome.step5Desc:Cuando tus amigos comenten cada parada de tu viaje, ganas Karma` },
  ];

  prevSlide() { this.slideIdx.update(i => (i - 1 + this.slides.length) % this.slides.length); }
  nextSlide() { this.slideIdx.update(i => (i + 1) % this.slides.length); }

  ngOnInit() {
    this.timer = setInterval(() => this.slideIdx.update(i => (i + 1) % this.slides.length), 5000);
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
