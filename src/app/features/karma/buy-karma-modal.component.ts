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
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal" style="max-width:460px;display:flex;flex-direction:column;max-height:90vh">

        <!-- Header -->
        <div class="modal-head"
             style="background:linear-gradient(135deg,var(--lav),var(--peach));flex-shrink:0">
          <div class="modal-title" i18n="@@buyKarma.title">Comprar Karma ✨</div>
          <div class="modal-sub" i18n="@@buyKarma.subtitle">Elige un paquete y completa el pago</div>
        </div>

        <div class="modal-body" style="overflow-y:auto;flex:1;scroll-behavior:smooth">

          <!-- Loading packages -->
          @if (loading()) {
            <div style="text-align:center;padding:24px;color:var(--t3);font-size:13px"
                 i18n="@@buyKarma.loading">Cargando paquetes…</div>
          }

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

            <!-- PayPal button area (real mode) -->
            @if (selected() && !isMockMode) {
              <div id="paypal-btn-container" style="min-height:48px"></div>
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

        </div>

        <div class="modal-foot" style="flex-direction:column;gap:8px;flex-shrink:0">
          @if (step() !== 'success') {
            <button class="btn-pill btn-outline"
                    style="width:100%;justify-content:center"
                    (click)="closed.emit()"
                    i18n="@@buyKarma.cancelBtn">Cancelar</button>
          } @else {
            <button class="btn-pill btn-primary"
                    style="width:100%;justify-content:center"
                    (click)="closed.emit()"
                    i18n="@@buyKarma.doneBtn">¡Listo!</button>
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

  packages   = signal<KarmaPackage[]>([]);
  selected   = signal<KarmaPackage | null>(null);
  step       = signal<'select' | 'success' | 'error'>('select');
  loading    = signal(true);
  errorMsg   = signal('');
  karmaAdded = signal(0);

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

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  selectPackage(pkg: KarmaPackage): void {
    this.selected.set(pkg);
    if (!this.isMockMode) {
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
      createOrder: () =>
        firstValueFrom(this.api.createKarmaOrder(pkg.id).pipe(map(r => r.orderID))),

      onApprove: (data: { orderID: string }) =>
        firstValueFrom(this.api.captureKarmaOrder(data.orderID)).then(res => {
          this.karmaAdded.set(res.karmaAdded);
          this.karma.purchaseComplete(res.karmaAdded);
          this.karmaGained.emit(res.karmaAdded);
          this.step.set('success');
        }),

      onError: () => {
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
    firstValueFrom(
      this.api.createKarmaOrder(pkg.id).pipe(map(r => r.orderID)),
    ).then(orderID =>
      firstValueFrom(this.api.captureKarmaOrder(orderID))
    ).then(res => {
      this.karmaAdded.set(res.karmaAdded);
      this.karma.purchaseComplete(res.karmaAdded);
      this.karmaGained.emit(res.karmaAdded);
      this.step.set('success');
    }).catch(() => {
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
