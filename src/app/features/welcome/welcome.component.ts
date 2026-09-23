import { Component, output, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';
import { BackgroundSliderComponent, SLIDES } from '../../shared/background-slider/background-slider.component';
import { HighlightTargetDirective } from '../../shared/highlight-tour/highlight-target.directive';
import { SavedPlansService, SavedPlan } from '../../core/saved-plans/saved-plans.service';
import { LandingFeedService } from '../landing/feed/landing-feed.service';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
    selector: 'app-welcome',
    imports: [BackgroundSliderComponent, HighlightTargetDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <app-background-slider
      [activeIdx]="slideIdx()"
      (dotClick)="slideIdx.set($event)" />

    <div class="welcome-overlay">
      <div class="welcome-content">
        <div class="welcome-eyebrow" i18n="@@welcome.eyebrow">Planifica · Comparte · Explora</div>
        <h1 class="welcome-title" i18n="@@welcome.title">Viaja pensando en tu<br/><em>mejor amig&#64;</em></h1>
        <p class="welcome-sub" i18n="@@welcome.subtitle">Crea viajes a múltiples destinos, descubre atracciones locales y deja que tus amigos comenten cada parada.</p>
        <div class="welcome-ctas">
          <button class="welcome-cta welcome-cta-primary" (click)="addDestination.emit()"
                  i18n="@@welcome.ctaCreatePlan">Crear Plan</button>
          <button class="welcome-cta welcome-cta-ai" tbHighlightTarget="ai-plan-btn" (click)="openAiPlanning.emit()"
                  i18n="@@welcome.ctaCreateAi">🐾 Crear con IA</button>
          <button class="welcome-cta welcome-cta-karma" (click)="howKarmaOpen.set(true)"
                  i18n="@@welcome.ctaHowKarma">⭐ Cómo ganar Token</button>
          @if (lastEditedPlan(); as plan) {
            <button class="welcome-cta welcome-cta-last" (click)="loadLastEditedPlan.emit(plan)">
              <span i18n="@@welcome.ctaLastPlan">🕓 Último viaje que editaste</span>
              <span class="welcome-cta-last-name">{{ plan.name }}</span>
            </button>
          }
        </div>

        @if (howKarmaOpen()) {
          <div class="welcome-karma-modal-backdrop" (click)="howKarmaOpen.set(false)">
            <div class="welcome-karma-modal" (click)="$event.stopPropagation()">
              <h3 i18n="@@welcome.karmaTitle">Cómo ganar Token ⭐</h3>
              <p i18n="@@welcome.karmaBody">Gana Token cuando tus amigos comentan las paradas de tus viajes compartidos. Úsalo para clonar viajes, exportar itinerarios y planificar con IA.</p>
              <button class="btn-pill btn-primary" (click)="howKarmaOpen.set(false)"
                      i18n="@@welcome.karmaClose">Entendido</button>
            </div>
          </div>
        }
      </div>
      @if (showFeedPill()) {
        <button type="button" class="welcome-feed-pill" (click)="scrollToFeed.emit()"
                [attr.aria-label]="feedPillLabel()">
          <span class="welcome-feed-pill-text">{{ feedPillLabel() }}</span>
          <svg class="welcome-feed-pill-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      }
    </div>
  `
})
export class WelcomeComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly savedPlans = inject(SavedPlansService);

  addDestination = output<void>();
  openAiPlanning = output<void>();
  loadLastEditedPlan = output<SavedPlan>();
  scrollToFeed = output<void>();
  private readonly feed = inject(LandingFeedService);
  private readonly locale = inject(LocaleService);

  /** Feedback F2 (2026-09-20) — the pill (and the S6 section it scrolls to) is only
   *  for logged-in visitors. */
  protected readonly showFeedPill = computed(() => this.auth.isLoggedIn() && this.feed.hasItems());
  protected readonly feedPillLabel = computed(() => {
    const top = this.feed.topPlan();
    if (top && top.favoriteCount >= 1) {
      const count = new Intl.NumberFormat(this.locale.current()).format(top.favoriteCount);
      const name = top.tripName.length > 28 ? `${top.tripName.slice(0, 27).trimEnd()}…` : top.tripName;
      return $localize`:@@welcome.feedPillTop:♥ ${count}:count: · ${name}:name: — ver más`;
    }
    return $localize`:@@welcome.feedPillGeneric:Descubre planes de otros viajeros`;
  });
  slideIdx = signal(0);
  readonly slides = SLIDES;
  readonly howKarmaOpen = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  readonly lastEditedPlan = computed<SavedPlan | null>(() => {
    if (!this.auth.isLoggedIn()) return null;
    const plans = this.savedPlans.plans();
    if (plans.length === 0) return null;
    return [...plans].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
  });

  ngOnInit() {
    this.timer = setInterval(() => this.slideIdx.update(i => (i + 1) % this.slides.length), 5000);
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
