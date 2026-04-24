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
        <div class="welcome-eyebrow">Plan · Share · Explore</div>
        <h1 class="welcome-title">Travel with your<br/><em>bestie</em> in mind</h1>
        <p class="welcome-sub">Build multi-destination trips, discover local attractions, and let your friends leave comments on every stop.</p>
        <div class="welcome-actions">
          <button class="btn-pill btn-primary"
                  style="padding:11px 24px;font-size:14px"
                  (click)="addDestination.emit()">+ Add Destination</button>
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
    { n: 1, t: 'Choose a city', d: '120+ destinations worldwide' },
    { n: 2, t: 'Explore attractions', d: 'Curated spots to see & do' },
    { n: 3, t: 'Collect comments', d: 'Friends leave tips on each stop' },
  ];

  prevSlide() { this.slideIdx.update(i => (i - 1 + this.slides.length) % this.slides.length); }
  nextSlide() { this.slideIdx.update(i => (i + 1) % this.slides.length); }

  ngOnInit() {
    this.timer = setInterval(() => this.slideIdx.update(i => (i + 1) % this.slides.length), 5000);
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
