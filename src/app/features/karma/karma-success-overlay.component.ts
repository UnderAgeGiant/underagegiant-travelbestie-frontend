import { Component, input, output } from '@angular/core';

/**
 * Full-screen celebration overlay shown after a successful karma purchase.
 * Appears above everything (z-index 2000) with animated particles, a bounce-in
 * emoji, a pop-in "+N ✨" counter, and a dismiss button.
 * Emits `dismissed` when the user taps the button or the backdrop.
 */
@Component({
  selector: 'app-karma-success-overlay',
  standalone: true,
  styles: [`
    .ks-backdrop {
      position: fixed; inset: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      background: oklch(10% 0.05 270 / 78%);
      backdrop-filter: blur(6px);
      animation: ks-backdrop-in 0.22s ease-out;
    }
    @keyframes ks-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .ks-card {
      position: relative;
      background: #fff; border-radius: 28px;
      padding: 48px 36px 40px; max-width: 380px; width: 90%;
      text-align: center; overflow: hidden;
      box-shadow: 0 32px 72px oklch(10% 0.1 270 / 45%);
      animation: ks-card-in 0.38s cubic-bezier(.34, 1.56, .64, 1);
    }
    @keyframes ks-card-in {
      from { transform: scale(0.65) translateY(28px); opacity: 0; }
      to   { transform: scale(1)    translateY(0);    opacity: 1; }
    }

    /* ── floating sparkle particles ── */
    .ks-particle {
      position: absolute; pointer-events: none; line-height: 1; user-select: none;
      animation: ks-float 2.6s ease-in-out infinite;
    }
    @keyframes ks-float {
      0%, 100% { transform: translateY(0)     rotate(0deg);  opacity: 0.75; }
      50%       { transform: translateY(-20px) rotate(20deg); opacity: 1;    }
    }
    .ks-p1 { top:  8%; left:  8%; font-size: 22px; animation-delay: 0s;    }
    .ks-p2 { top: 11%; right: 9%; font-size: 28px; animation-delay: 0.45s; }
    .ks-p3 { top: 55%; left:  5%; font-size: 18px; animation-delay: 0.9s;  }
    .ks-p4 { top: 68%; right: 7%; font-size: 22px; animation-delay: 1.35s; }
    .ks-p5 { top: 36%; left:  3%; font-size: 14px; animation-delay: 0.22s; }
    .ks-p6 { top: 42%; right: 4%; font-size: 16px; animation-delay: 1.7s;  }

    /* ── content ── */
    .ks-emoji {
      font-size: 64px; display: block; margin-bottom: 16px;
      animation: ks-emoji-bounce 0.5s 0.1s cubic-bezier(.34, 1.56, .64, 1) both;
    }
    @keyframes ks-emoji-bounce {
      from { transform: scale(0) rotate(-25deg); opacity: 0; }
      to   { transform: scale(1) rotate(0deg);   opacity: 1; }
    }

    .ks-amount {
      font-size: 52px; font-weight: 900; line-height: 1;
      background: linear-gradient(135deg, oklch(55% 0.22 280), oklch(42% 0.18 145));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ks-amount-pop 0.42s 0.22s ease-out both;
      margin-bottom: 12px;
    }
    @keyframes ks-amount-pop {
      from { transform: scale(0.35); opacity: 0; }
      65%  { transform: scale(1.14); }
      to   { transform: scale(1);    opacity: 1; }
    }

    .ks-title {
      font-size: 21px; font-weight: 800; color: oklch(18% 0.04 270);
      margin-bottom: 8px;
      animation: ks-fade-up 0.32s 0.38s ease-out both;
    }
    .ks-sub {
      font-size: 13px; color: oklch(52% 0.04 270);
      margin-bottom: 32px;
      animation: ks-fade-up 0.32s 0.48s ease-out both;
    }
    @keyframes ks-fade-up {
      from { transform: translateY(12px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .ks-btn {
      width: 100%; justify-content: center;
      font-size: 15px !important; padding: 11px !important;
      animation: ks-fade-up 0.32s 0.58s ease-out both;
    }
  `],
  template: `
    <div class="ks-backdrop" (click)="dismissed.emit()">
      <div class="ks-card" (click)="$event.stopPropagation()">

        <!-- floating sparkle particles -->
        <span class="ks-particle ks-p1" aria-hidden="true">✨</span>
        <span class="ks-particle ks-p2" aria-hidden="true">🌟</span>
        <span class="ks-particle ks-p3" aria-hidden="true">✨</span>
        <span class="ks-particle ks-p4" aria-hidden="true">⭐</span>
        <span class="ks-particle ks-p5" aria-hidden="true">✨</span>
        <span class="ks-particle ks-p6" aria-hidden="true">🌟</span>

        <span class="ks-emoji" aria-hidden="true">🎉</span>

        <div class="ks-amount">+{{ amount() }} ✨</div>

        <div class="ks-title" i18n="@@karmaSuccess.title">¡Karma añadido!</div>

        <div class="ks-sub">
          <ng-container i18n="@@karmaSuccess.sub">Tu karma ahora es</ng-container>
          <strong> {{ newTotal() }} ✨</strong>
        </div>

        <button class="btn-pill btn-primary ks-btn"
                (click)="dismissed.emit()"
                i18n="@@karmaSuccess.btn">¡Increíble! →</button>

      </div>
    </div>
  `,
})
export class KarmaSuccessOverlayComponent {
  /** Karma units just added (shown as "+N ✨"). */
  amount   = input.required<number>();
  /** Current total karma after purchase (shown as "Tu karma ahora es N ✨"). */
  newTotal = input.required<number>();
  /** Fires when the user dismisses the overlay (button or backdrop click). */
  dismissed = output<void>();
}
