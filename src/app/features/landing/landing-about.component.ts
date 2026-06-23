import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  inject, OnInit, QueryList, signal, ViewChildren,
} from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AppStats } from '../../core/models/featured-trip.model';

@Component({
    selector: 'tb-landing-about',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [],
    host: { class: 'landing-snap-child landing-about' },
    template: `
<div class="landing-about-inner">

  <div class="reveal hidden landing-about-copy">
    <h2 class="landing-about-heading" i18n="@@landing.aboutHeading">
      Planifica el viaje<br><em>que siempre soñaste</em>
    </h2>
    <p class="landing-about-mission" i18n="@@landing.aboutMission">
      Tripilove reúne miles de atracciones turísticas en decenas
      de ciudades para que armes tu itinerario perfecto, lo compartas con tus mejores
      amigos y lo hagas realidad.
    </p>
  </div>

  <div class="reveal hidden landing-about-stats" aria-label="Estadísticas">
    @if (stats(); as s) {
      <div class="landing-stat">
        <span class="landing-stat-number" #statEl [attr.data-target]="s.cities">0</span>
        <span class="landing-stat-label" i18n="@@landing.statCities">ciudades</span>
      </div>
      <div class="landing-stat">
        <span class="landing-stat-number" #statEl [attr.data-target]="s.users">0</span>
        <span class="landing-stat-label" i18n="@@landing.statUsers">viajeros</span>
      </div>
      <div class="landing-stat">
        <span class="landing-stat-number" #statEl [attr.data-target]="s.plans">0</span>
        <span class="landing-stat-label" i18n="@@landing.statPlans">planes creados</span>
      </div>
    }
  </div>

</div>
  `
})
export class LandingAboutComponent implements OnInit, AfterViewInit {
  @ViewChildren('statEl') statEls!: QueryList<ElementRef<HTMLSpanElement>>;

  protected readonly stats = signal<AppStats | null>(null);
  private readonly api  = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private animated = false;

  ngOnInit(): void {
    this.api.getStats().subscribe({
      next:  s => this.stats.set(s),
      error: () => { /* silently omit stats row */ },
    });
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.animated) {
          this.animated = true;
          // Reveal entrance elements (mirrors demo pattern)
          (this.host.nativeElement.querySelectorAll('.reveal.hidden') as NodeListOf<HTMLElement>).forEach(
            (el: HTMLElement) => el.classList.remove('hidden')
          );
          setTimeout(() => this.animateStats(), 180);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(this.host.nativeElement);
  }

  private animateStats(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.statEls.forEach(el => {
      const target = Number(el.nativeElement.dataset['target'] ?? 0);
      if (prefersReducedMotion) { el.nativeElement.textContent = String(target); return; }
      const duration = 1400;
      const start    = Date.now();
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 4);
        el.nativeElement.textContent = String(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
}
