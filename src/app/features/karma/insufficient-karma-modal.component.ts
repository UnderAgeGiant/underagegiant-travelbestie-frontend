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
        <div class="modal-foot" style="flex-direction:column;gap:12px">
          <button class="btn-pill btn-primary"
                  style="width:100%;padding:12px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px"
                  (click)="karmaModal.goToBuy()" type="button">
            💳 <span i18n="@@kim.buyBtn">Comprar karma</span>
          </button>

          <!-- Free karma tip -->
          <div class="kim-tip">
            <div class="kim-tip-title" i18n="@@kim.earnTitle">¿Prefieres ganar karma gratis?</div>
            <p class="kim-tip-body" i18n="@@kim.earnBody">
              Busca un plan público en la barra de búsqueda, visita el enlace,
              deja un comentario en cualquier parada
              → <strong>+1 karma</strong> por comentario nuevo.
            </p>
            <button class="btn-pill btn-outline kim-tip-dismiss"
                    (click)="karmaModal.closeInsufficient()" type="button"
                    i18n="@@kim.earnDismiss">
              Entendido
            </button>
          </div>
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
    .kim-tip {
      background: var(--lav); border-radius: 12px;
      padding: 14px 16px; text-align: left;
    }
    .kim-tip-title {
      font-size: 13px; font-weight: 700; color: var(--lav-d);
      margin-bottom: 6px;
    }
    .kim-tip-body {
      font-size: 12px; color: var(--t2); line-height: 1.55;
      margin: 0 0 12px;
    }
    .kim-tip-dismiss { font-size: 12px; padding: 5px 14px; }
  `]
})
export class InsufficientKarmaModalComponent {
  readonly karmaModal = inject(KarmaModalService);
  readonly data = computed(() => this.karmaModal.insufficientData() ?? { need: 1, have: 0 });
}
