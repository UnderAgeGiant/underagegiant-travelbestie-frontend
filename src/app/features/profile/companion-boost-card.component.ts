import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';

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
      } @else {
        <img class="companion-boost-img" src="/standing-black-dog.jpeg" alt="Asistente Miel" draggable="false" />
        <p class="companion-boost-copy" i18n="@@companion.boostCopy">
          Por ahora la Asistente Miel está distraída con el resto de los usuarios. Dale un premio (−2 Karma) para que te ponga atención durante las próximas 24 horas
        </p>
        <button type="button" class="btn-pill btn-primary companion-boost-btn" (click)="companion.boost()"
                i18n="@@companion.boostBtn">Dar premio</button>
      }
    </div>
  `,
})
export class CompanionBoostCardComponent implements OnInit, OnDestroy {
  protected readonly companion = inject(CompanionSuggestionService);

  private readonly now = signal(Date.now());
  private tickTimer: ReturnType<typeof setInterval> | null = null;

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
  }

  ngOnInit(): void {
    this.companion.refreshBoostStatus();
  }

  ngOnDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }
}
