import { Component, inject, computed } from '@angular/core';
import { KarmaModalService } from '../../core/karma/karma-modal.service';

@Component({
  selector: 'app-insufficient-karma-modal',
  standalone: true,
  template: `
    <div class="kim-overlay" (click)="karmaModal.closeInsufficient()">
      <div class="kim-modal" (click)="$event.stopPropagation()">

        <button class="kim-close" (click)="karmaModal.closeInsufficient()" type="button" aria-label="Cerrar">×</button>

        <div class="kim-icon">⭐</div>
        <h2 class="kim-title" i18n="@@kim.title">Karma insuficiente</h2>
        <p class="kim-subtitle" i18n="@@kim.subtitle">Necesitas más karma para completar esta acción.</p>

        <div class="kim-balance-row">
          <div class="kim-balance-col">
            <span class="kim-balance-val kim-val-have">{{ data().have }}</span>
            <span class="kim-balance-lbl" i18n="@@kim.have">Tienes</span>
          </div>
          <span class="kim-balance-sep">→</span>
          <div class="kim-balance-col">
            <span class="kim-balance-val kim-val-need">{{ data().need }}</span>
            <span class="kim-balance-lbl" i18n="@@kim.need">Necesitas</span>
          </div>
        </div>

        <p class="kim-shortfall">
          <span i18n="@@kim.shortfallPre">Te faltan</span>
          <strong> {{ data().need - data().have }} karma</strong>
          <span i18n="@@kim.shortfallPost"> para esta acción.</span>
        </p>

        <div class="kim-actions">
          <button class="kim-btn-primary" (click)="karmaModal.goToBuy()" type="button">
            <span class="kim-btn-ico">💳</span>
            <span i18n="@@kim.buyBtn">Comprar karma</span>
          </button>

          <button class="kim-btn-secondary" (click)="karmaModal.requestSearch()" type="button">
            <span class="kim-btn-secondary-top">
              <span class="kim-btn-ico">💬</span>
              <span i18n="@@kim.earnBtn">Comentar en viajes de otros</span>
            </span>
            <span class="kim-btn-earn-tip" i18n="@@kim.earnTip">
              Busca un viaje compartido y deja un comentario → +1 karma gratis
            </span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .kim-overlay {
      position: fixed; inset: 0; z-index: 1100;
      background: oklch(0% 0 0 / 0.48);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .18s ease;
    }
    .kim-modal {
      background: var(--card);
      border-radius: 22px;
      padding: 36px 28px 28px;
      width: min(400px, 92vw);
      box-shadow: 0 24px 64px oklch(0% 0 0 / 0.28);
      position: relative;
      text-align: center;
      animation: slideUp .22s ease;
    }
    .kim-close {
      position: absolute; top: 12px; right: 14px;
      background: none; border: none; font-size: 22px;
      color: var(--t3); cursor: pointer; padding: 2px 6px; line-height: 1;
      transition: color .12s;
    }
    .kim-close:hover { color: var(--t1); }
    .kim-icon { font-size: 46px; line-height: 1; margin-bottom: 10px; }
    .kim-title {
      font-size: 20px; font-weight: 700; color: var(--t1);
      margin: 0 0 6px;
    }
    .kim-subtitle {
      font-size: 13px; color: var(--t2);
      margin: 0 0 20px; line-height: 1.4;
    }
    .kim-balance-row {
      display: flex; align-items: center; justify-content: center; gap: 18px;
      background: var(--cream); border-radius: 14px;
      padding: 18px 24px; margin-bottom: 12px;
    }
    .kim-balance-col {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
    }
    .kim-balance-val {
      font-size: 36px; font-weight: 800; line-height: 1;
    }
    .kim-balance-lbl {
      font-size: 10px; color: var(--t3); font-weight: 600;
      text-transform: uppercase; letter-spacing: .06em;
    }
    .kim-balance-sep { font-size: 22px; color: var(--t3); font-weight: 300; }
    .kim-val-have { color: oklch(50% 0.18 145); }
    .kim-val-need { color: oklch(52% 0.22 25); }
    .kim-shortfall {
      font-size: 13px; color: var(--t2); margin: 0 0 22px;
    }
    .kim-actions { display: flex; flex-direction: column; gap: 10px; }
    .kim-btn-primary {
      width: 100%; padding: 13px 20px;
      background: var(--accent); color: #fff;
      border: none; border-radius: 12px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity .14s;
    }
    .kim-btn-primary:hover { opacity: .87; }
    .kim-btn-secondary {
      width: 100%; padding: 11px 16px;
      background: none; border: 1.5px solid var(--border);
      border-radius: 12px; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      transition: background .14s;
    }
    .kim-btn-secondary:hover { background: var(--cream); }
    .kim-btn-secondary-top {
      display: flex; align-items: center; gap: 7px;
      font-size: 14px; font-weight: 600; color: var(--t1);
    }
    .kim-btn-earn-tip {
      font-size: 11px; color: var(--t3); line-height: 1.4;
    }
    .kim-btn-ico { font-size: 16px; }
  `]
})
export class InsufficientKarmaModalComponent {
  readonly karmaModal = inject(KarmaModalService);
  readonly data = computed(() => this.karmaModal.insufficientData() ?? { need: 1, have: 0 });
}
