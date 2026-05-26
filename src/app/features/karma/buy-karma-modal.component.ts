import {
  Component, inject, signal, output, OnDestroy,
} from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { KarmaService } from '../../core/karma/karma.service';
import { KarmaPackage } from '../../core/models/karma-purchase.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-buy-karma-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop">
      <div class="modal" style="max-width:460px;display:flex;flex-direction:column;max-height:90vh">

        <!-- Header (flex-shrink:0 keeps it pinned while body scrolls) -->
        <div class="modal-head"
             style="background:linear-gradient(135deg,var(--lav),var(--peach));flex-shrink:0">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
            <div>
              <div class="modal-title" i18n="@@buyKarma.title">Comprar Karma ✨</div>
              <div class="modal-sub" i18n="@@buyKarma.subtitle">Elige un paquete y completa el pago</div>
            </div>
            <button
              (click)="closed.emit()"
              style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:oklch(0% 0 0/.15);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;line-height:1;transition:background .12s"
              i18n-aria-label="@@buyKarma.closeAriaLabel"
              aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>

        <div class="modal-body" style="overflow-y:auto;flex:1;scroll-behavior:smooth">

          <!-- State A: Loading packages -->
          @if (loading()) {
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px">
              <div style="width:36px;height:36px;border-radius:50%;border:3px solid var(--lav);border-top-color:var(--lav-d);animation:spin .7s linear infinite"></div>
              <div style="font-size:12px;color:var(--t3)" i18n="@@buyKarma.loading">Cargando paquetes…</div>
            </div>
          }

          <!-- State C+D: Processing payment (covers createOrder + captureOrder wait) -->
          @if (paying()) {
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;gap:14px">
              <div style="width:44px;height:44px;border-radius:50%;border:4px solid var(--lav);border-top-color:var(--lav-d);animation:spin .7s linear infinite"></div>
              <div style="font-size:13px;font-weight:600;color:var(--t2)" i18n="@@buyKarma.processingPayment">Procesando pago…</div>
              <div style="font-size:11px;color:var(--t3)" i18n="@@buyKarma.doNotClose">No cierres esta ventana</div>
            </div>
          }

          @if (!paying()) {
            <!-- Package selector -->
            @if (!loading() && step() === 'select') {
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
                @for (pkg of packages(); track pkg.id) {
                  <button
                    (click)="selectPackage(pkg)"
                    [style]="selected()?.id === pkg.id
                      ? 'border:2.5px solid var(--lav-d);background:var(--lav)'
                      : 'border:1.5px solid var(--border);background:#fff'"
                    style="border-radius:12px;padding:14px 10px;cursor:pointer;text-align:center;transition:all .12s">
                    <div style="font-size:22px">✨</div>
                    <div style="font-size:16px;font-weight:700;color:var(--t1);margin-top:4px">{{ pkg.karma }}</div>
                    <div style="font-size:11px;color:var(--t3);font-weight:500" i18n="@@buyKarma.karma">karma</div>
                    <div style="font-size:13px;font-weight:700;color:var(--lav-d);margin-top:6px">{{ pkg.currency }} {{ pkg.price }}</div>
                  </button>
                }
              </div>

              <!-- State B: PayPal SDK loading / button rendering (real mode) -->
              @if (selected() && !isMockMode) {
                @if (paypalLoading()) {
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;gap:10px">
                    <div style="width:30px;height:30px;border-radius:50%;border:3px solid var(--lav);border-top-color:var(--lav-d);animation:spin .7s linear infinite"></div>
                    <div style="font-size:11px;color:var(--t3)" i18n="@@buyKarma.paypalLoading">Cargando botón de pago…</div>
                  </div>
                }
                <div id="paypal-btn-container" [style.display]="paypalLoading() ? 'none' : 'block'" style="min-height:48px"></div>
              }

              <!-- Demo buy button (mock mode) -->
              @if (selected() && isMockMode) {
                <button class="btn-pill btn-primary"
                        style="width:100%;justify-content:center"
                        (click)="simulatePurchase()"
                        i18n="@@buyKarma.simulateBtn">
                  🎮 Simular compra (modo demo)
                </button>
              }
            }

            <!-- Success state -->
            @if (step() === 'success') {
              <div style="text-align:center;padding:16px 0">
                <div style="font-size:40px">🎉</div>
                <div style="font-size:16px;font-weight:700;color:var(--t1);margin-top:8px"
                     i18n="@@buyKarma.successTitle">¡Karma añadido!</div>
                <div style="font-size:13px;color:var(--t3);margin-top:4px">
                  <ng-container i18n="@@buyKarma.successMsg">Tu cuenta fue acreditada con</ng-container>
                  <strong> +{{ karmaAdded() }} ✨</strong>
                </div>
              </div>
            }

            <!-- Error state -->
            @if (step() === 'error') {
              <div style="text-align:center;padding:16px 0">
                <div style="font-size:13px;color:oklch(50% .18 25)">⚠ {{ errorMsg() }}</div>
                <button class="btn-pill btn-ghost"
                        style="margin-top:12px"
                        (click)="resetToSelect()"
                        i18n="@@buyKarma.retryBtn">Reintentar</button>
              </div>
            }
          }

        </div>

      </div>
    </div>
  `,
})
export class BuyKarmaModalComponent implements OnDestroy {
  private readonly api   = inject(ApiService);
  private readonly karma = inject(KarmaService);

  readonly isMockMode = environment.useMocks;

  closed      = output<void>();
  karmaGained = output<number>();

  packages      = signal<KarmaPackage[]>([]);
  selected      = signal<KarmaPackage | null>(null);
  step          = signal<'select' | 'success' | 'error'>('select');
  loading       = signal(true);
  errorMsg      = signal('');
  karmaAdded    = signal(0);
  paypalLoading = signal(false); // true while PayPal SDK loads / button renders
  paying        = signal(false); // true during createOrder or captureOrder network calls

  // PayPal-specific: lazily-injected SDK script element
  private paypalScriptEl: HTMLScriptElement | null = null;
  // Watches #paypal-btn-container growth and scrolls it into view once rendered
  private paypalResizeObserver: ResizeObserver | null = null;

  constructor() {
    this.api.getKarmaPackages().subscribe(res => {
      this.packages.set(res.packages);
      this.loading.set(false);
    });
  }

  selectPackage(pkg: KarmaPackage): void {
    this.selected.set(pkg);
    if (!this.isMockMode) {
      this.paypalLoading.set(true); // show spinner while SDK loads / button renders
      // Small delay lets Angular render the container div first
      setTimeout(() => this.loadPayPalAndRender(pkg), 50);
    }
  }

  private loadPayPalAndRender(pkg: KarmaPackage): void {
    const win = window as unknown as Record<string, unknown>;
    if (win['paypal']) {
      this.renderPayPalButton(pkg);
      return;
    }
    if (this.paypalScriptEl) return; // already loading

    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=${pkg.currency}`;
    s.onload  = () => this.renderPayPalButton(pkg);
    s.onerror = () => {
      this.paypalLoading.set(false);
      this.errorMsg.set('No se pudo cargar el SDK de pago. Revisa tu conexión.');
      this.step.set('error');
    };
    document.head.appendChild(s);
    this.paypalScriptEl = s;
  }

  private renderPayPalButton(pkg: KarmaPackage): void {
    const container = document.getElementById('paypal-btn-container');
    if (!container) return;
    container.innerHTML = ''; // clear previous render

    const win = window as unknown as Record<string, unknown>;
    const paypal = win['paypal'] as {
      Buttons: (opts: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: () => void;
      }) => { render: (selector: string) => void };
    };

    paypal.Buttons({
      createOrder: () => {
        this.paying.set(true); // show spinner while server creates the order
        return firstValueFrom(this.api.createKarmaOrder(pkg.id).pipe(map(r => r.orderID)));
      },

      onApprove: (data: { orderID: string }) =>
        firstValueFrom(this.api.captureKarmaOrder(data.orderID)).then(res => {
          this.paying.set(false);
          this.karmaAdded.set(res.karmaAdded);
          this.karma.purchaseComplete(res.karmaAdded);
          this.karmaGained.emit(res.karmaAdded);
          this.step.set('success');
        }),

      onError: () => {
        this.paying.set(false);
        this.errorMsg.set('El pago falló. Por favor intenta de nuevo.');
        this.step.set('error');
      },
    }).render('#paypal-btn-container');

    // Auto-scroll the modal body to reveal PayPal's UI as it renders.
    // PayPal injects buttons and optional Pay Later / credit messaging
    // asynchronously, so we watch the container's height with a ResizeObserver
    // and scroll it into view the moment it gains content.
    this.paypalResizeObserver?.disconnect();
    this.paypalResizeObserver = new ResizeObserver(entries => {
      if ((entries[0]?.contentRect.height ?? 0) > 0) {
        this.paypalLoading.set(false); // hide spinner, reveal rendered PayPal button
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.paypalResizeObserver?.disconnect();
        this.paypalResizeObserver = null;
      }
    });
    this.paypalResizeObserver.observe(container);
  }

  simulatePurchase(): void {
    const pkg = this.selected();
    if (!pkg) return;
    this.paying.set(true);
    firstValueFrom(
      this.api.createKarmaOrder(pkg.id).pipe(map(r => r.orderID)),
    ).then(orderID =>
      firstValueFrom(this.api.captureKarmaOrder(orderID))
    ).then(res => {
      this.paying.set(false);
      this.karmaAdded.set(res.karmaAdded);
      this.karma.purchaseComplete(res.karmaAdded);
      this.karmaGained.emit(res.karmaAdded);
      this.step.set('success');
    }).catch(() => {
      this.paying.set(false);
      this.errorMsg.set('Error en simulación.');
      this.step.set('error');
    });
  }

  resetToSelect(): void {
    this.step.set('select');
    this.errorMsg.set('');
  }

  ngOnDestroy(): void {
    this.paypalResizeObserver?.disconnect();
    this.paypalResizeObserver = null;
    // Clean up dynamically injected PayPal script only if SDK hasn't loaded yet
    const win = window as unknown as Record<string, unknown>;
    if (this.paypalScriptEl && !win['paypal']) {
      this.paypalScriptEl.remove();
      this.paypalScriptEl = null;
    }
  }
}
