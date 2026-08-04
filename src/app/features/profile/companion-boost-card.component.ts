import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';

const CELEBRATE_MS = 2600;

@Component({
  selector: 'app-companion-boost-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="companion-boost-card">
      @if (isBoosted()) {
        <img class="companion-boost-img" src="/snack-hearts-black-dog.png" alt="Asistente Miel" draggable="false" />
        <p class="companion-boost-boosted" i18n="@@companion.boostedLabel">¡Miel está atenta hoy! 🦴💕</p>
        <p class="companion-boost-timer" i18n="@@companion.boostTimer">Termina en {{ remainingLabel() }}</p>
        @if (celebrating()) {
          <div class="companion-celebrate" aria-hidden="true">
            <span class="companion-celebrate-emoji">🎉</span>
            <span class="companion-celebrate-emoji">❤️</span>
            <span class="companion-celebrate-emoji">🎆</span>
            <span class="companion-celebrate-emoji">💕</span>
            <span class="companion-celebrate-emoji">✨</span>
            <span class="companion-celebrate-emoji">🎉</span>
            <span class="companion-celebrate-emoji">❤️</span>
            <span class="companion-celebrate-emoji">🎆</span>
          </div>
        }
      } @else {
        <img class="companion-boost-img" src="/standing-black-dog.jpeg" alt="Asistente Miel" draggable="false" />
        <p class="companion-boost-copy" i18n="@@companion.boostCopy">
          Por ahora Miel está jugando con otro usuario. Dale un premio 🦴 para que juegue contigo. ¡Durante las próximas 24 horas Miel jugara contigo y te dará más sugerencias sobre tu viaje!
        </p>
        <button type="button" class="btn-pill btn-primary companion-boost-btn" (click)="companion.boost()"
                i18n="@@companion.boostBtn">Dar premio (−2 Karma 🦴)</button>
      }
    </div>
  `,
})
export class CompanionBoostCardComponent implements OnInit, OnDestroy {
  protected readonly companion = inject(CompanionSuggestionService);

  private readonly now = signal(Date.now());
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private celebrateTimer: ReturnType<typeof setTimeout> | null = null;

  /** Derived from boostExpiresAt() vs a locally-ticking now() — NOT from
   *  companion.boosted() directly — so the card reverts to the unboosted state on
   *  its own the instant the countdown reaches zero, without waiting for another
   *  refreshBoostStatus() round trip. */
  protected readonly isBoosted = computed(() => {
    const expiresAt = this.companion.boostExpiresAt();
    return expiresAt !== null && expiresAt - this.now() > 0;
  });

  protected readonly remainingLabel = computed(() => {
    const expiresAt = this.companion.boostExpiresAt();
    if (expiresAt === null) return '00:00:00';
    const totalSeconds = Math.max(0, Math.floor((expiresAt - this.now()) / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  /** True for a few seconds right after a successful boost() purchase, to draw the
   *  eye with a hearts/fireworks burst. Never fires just from refreshBoostStatus()
   *  discovering an already-active boost (e.g. on page load). */
  protected readonly celebrating = signal(false);

  constructor() {
    // Restart the 1 s ticking interval whenever a boost turns on/off.
    effect(() => {
      const expiresAt = this.companion.boostExpiresAt();
      if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
      if (expiresAt !== null) {
        this.now.set(Date.now());
        this.tickTimer = setInterval(() => this.now.set(Date.now()), 1000);
      }
    });

    effect(() => {
      const tick = this.companion.boostJustPurchased();
      if (tick === 0) return; // initial value — not an actual purchase
      this.celebrating.set(true);
      if (this.celebrateTimer) clearTimeout(this.celebrateTimer);
      this.celebrateTimer = setTimeout(() => this.celebrating.set(false), CELEBRATE_MS);
    });
  }

  ngOnInit(): void {
    this.companion.refreshBoostStatus();
  }

  ngOnDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.celebrateTimer) clearTimeout(this.celebrateTimer);
  }
}
