import { Component, inject, computed } from '@angular/core';
import { KarmaModalService } from '../../core/karma/karma-modal.service';

@Component({
  selector: 'app-insufficient-karma-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="karmaModal.closeInsufficient()">
      <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-head" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div>
            <div class="modal-title" i18n="@@kim.title">Karma insuficiente ⭐</div>
            <div class="modal-sub" i18n="@@kim.subtitle">Necesitas más karma para completar esta acción.</div>
          </div>
          <button
            (click)="karmaModal.closeInsufficient()"
            style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:oklch(0% 0 0/.15);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;line-height:1;transition:background .12s"
            aria-label="Cerrar" type="button">
            ✕
          </button>
        </div>

        <!-- Balance display -->
        <div class="modal-body">
          <div class="kim-balance">
            <div class="kim-col">
              <span class="kim-val" style="color:oklch(50% .18 145)">{{ data().have }}</span>
              <span class="kim-lbl" i18n="@@kim.have">Tienes</span>
            </div>
            <span class="kim-arrow">→</span>
            <div class="kim-col">
              <span class="kim-val" style="color:oklch(52% .22 25)">{{ data().need }}</span>
              <span class="kim-lbl" i18n="@@kim.need">Necesitas</span>
            </div>
          </div>

          <p class="kim-shortfall">
            <span i18n="@@kim.shortfallPre">Te faltan</span>
            <strong> {{ data().need - data().have }} karma</strong>
            <span i18n="@@kim.shortfallPost"> para esta acción.</span>
          </p>
        </div>

        <!-- Actions -->
        <div class="modal-foot" style="flex-direction:column;gap:10px">
          <button class="btn-pill btn-primary" style="width:100%;padding:12px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px"
                  (click)="karmaModal.goToBuy()" type="button">
            💳 <span i18n="@@kim.buyBtn">Comprar karma</span>
          </button>
          <button class="kim-earn-btn"
                  (click)="karmaModal.requestSearch()" type="button">
            <span class="kim-earn-top">
              💬 <span i18n="@@kim.earnBtn">Comentar en viajes de otros</span>
            </span>
            <span class="kim-earn-tip" i18n="@@kim.earnTip">
              Busca un viaje compartido y deja un comentario → +1 karma gratis
            </span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .kim-balance {
      display: flex; align-items: center; justify-content: center; gap: 20px;
      background: var(--cream); border-radius: 14px;
      padding: 18px 24px; margin-bottom: 14px;
    }
    .kim-col { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .kim-val { font-size: 36px; font-weight: 800; line-height: 1; }
    .kim-lbl {
      font-size: 10px; color: var(--t3); font-weight: 600;
      text-transform: uppercase; letter-spacing: .06em;
    }
    .kim-arrow { font-size: 22px; color: var(--t3); font-weight: 300; }
    .kim-shortfall { font-size: 13px; color: var(--t2); margin: 0; text-align: center; }
    .kim-earn-btn {
      width: 100%; padding: 11px 16px;
      background: #fff; border: 1.5px solid var(--border);
      border-radius: 12px; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      transition: background .14s;
    }
    .kim-earn-btn:hover { background: var(--cream); }
    .kim-earn-top {
      display: flex; align-items: center; gap: 7px;
      font-size: 14px; font-weight: 600; color: var(--t1);
    }
    .kim-earn-tip { font-size: 11px; color: var(--t3); line-height: 1.4; }
  `]
})
export class InsufficientKarmaModalComponent {
  readonly karmaModal = inject(KarmaModalService);
  readonly data = computed(() => this.karmaModal.insufficientData() ?? { need: 1, have: 0 });
}
