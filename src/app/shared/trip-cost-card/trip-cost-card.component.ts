import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input, output, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { TripCostService } from '../../core/trip-cost/trip-cost.service';
import { ComfortLevel, CostEstimate } from '../../core/models/trip.model';
import { WORLD_CITIES } from '../../data/cities.data';

/** Structural subset shared by CostSettings and SharedCostSettings: only the origin name is shown. */
export interface CostCardSettings {
  origin:   { name: string } | null;
  adults:   number;
  children: number;
  infants?: number;
  comfort:  ComfortLevel;
}

/** Works for both CostEstimate and SharedCostEstimate (the latter reduces `settings`). */
export type CostCardEstimate = Omit<CostEstimate, 'settings'>;

/** Estimate card for the stop-panel footer (owner/collaborator) and the shared page (viewers). Presentational only. */
@Component({
  selector: 'app-trip-cost-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'owner' && collapsed()) {
      <!-- Editor only: one slim row by default; the whole row expands the card. -->
      <section class="tcc tcc--slim" [class.tcc--empty]="!calculating() && !estimate()">
        <button type="button" class="tcc-bar" aria-expanded="false" (click)="collapsed.set(false)">
          <span class="tcc-title tcc-bar-title" i18n="@@tripCost.title">Costo estimado del viaje</span>
          @if (calculating()) {
            <span class="tcc-status" i18n="@@tripCost.calculating">Calculando…</span>
          } @else if (estimate(); as est) {
            <span class="tcc-bar-total" [class.tcc-total--stale]="isStale()">≈ {{ cost.format(est.totalUsd) }} <small class="tcc-code">{{ cost.viewerCurrency() }}</small></span>
            @if (isStale()) {
              <span class="tcc-flag" i18n="@@tripCost.staleShort">Desactualizado</span>
            } @else if (est.unestimated.length > 0) {
              <span class="tcc-flag" i18n="@@tripCost.unestimated">sin estimar</span>
            }
          } @else {
            <span class="tcc-status" i18n="@@tripCost.notCalculated">Todavía no calculado</span>
          }
          <span class="tcc-chev" aria-hidden="true">▼</span>
        </button>
        @if (!calculating() && !estimate() && canCalculate()) {
          <button type="button" class="tcc-btn" (click)="calculate.emit()" i18n="@@tripCost.calculateBtn">Calcular precio</button>
        }
      </section>
    } @else if (mode() === 'owner' || estimate()) {
      <section class="tcc" [class.tcc--empty]="!calculating() && !estimate()" [class.tcc-stale]="isStale()">
        @if (mode() === 'shared') {
          <div class="tcc-title" i18n="@@tripCost.sharedTitle">Costo estimado para este grupo</div>
        } @else {
          <button type="button" class="tcc-head" aria-expanded="true" (click)="collapsed.set(true)">
            <span class="tcc-title" i18n="@@tripCost.title">Costo estimado del viaje</span>
            <span class="tcc-chev" aria-hidden="true">▲</span>
          </button>
        }

        @if (calculating()) {
          <div class="tcc-status" i18n="@@tripCost.calculating">Calculando…</div>
        } @else if (estimate(); as est) {
          <div class="tcc-total" [class.tcc-total--stale]="isStale()">
            ≈ {{ cost.format(est.totalUsd) }} <small class="tcc-code">{{ cost.viewerCurrency() }}</small>
          </div>

          @if (settings(); as s) {
            <div class="tcc-context">
              @if (s.origin) {
                <span i18n="@@tripCost.from">Desde</span> {{ s.origin.name }} ·
              }
              {{ s.adults }}
              @if (s.adults === 1) { <span i18n="@@tripCost.adultSingular">adulto</span> } @else { <span i18n="@@tripCost.adultPlural">adultos</span> }
              @if (s.children > 0) {
                · {{ s.children }}
                @if (s.children === 1) { <span i18n="@@tripCost.childSingular">niño</span> } @else { <span i18n="@@tripCost.childPlural">niños</span> }
              }
              @if (s.infants; as infants) {
                · {{ infants }}
                @if (infants === 1) { <span i18n="@@tripCost.infantSingular">bebé</span> } @else { <span i18n="@@tripCost.infantPlural">bebés</span> }
              }
              ·
              @switch (s.comfort) {
                @case ('budget') { <span i18n="@@costSettings.budget">Económico</span> }
                @case ('mid') { <span i18n="@@costSettings.mid">Intermedio</span> }
                @case ('luxury') { <span i18n="@@costSettings.luxury">Lujo</span> }
              }
            </div>
          }

          <div class="tcc-meta"><span class="tcc-glyph" i18n="@@tripCost.infoGlyph">ⓘ</span><span i18n="@@tripCost.calculatedOn">Calculado el {{ calculatedDate() }} · precio aproximado, ±30%</span></div>

          @if (isStale()) {
            <div class="tcc-stale-msg" i18n="@@tripCost.stale">Desactualizado · guarda para recalcular</div>
          }

          @if (est.missingOrigin) {
            <div class="tcc-missing">
              <span i18n="@@tripCost.noHomeFlights">Sin vuelos desde casa</span>
              @if (mode() === 'owner') {
                <button type="button" class="tcc-link" (click)="editSettings.emit()" i18n="@@tripCost.departsFrom">Sale desde</button>
              }
            </div>
          }

          <!-- Gap rows stay visible even folded, so the owner always sees the total is incomplete. -->
          @if (open() || est.unestimated.length > 0) {
            <div class="tcc-rows">
              @if (open()) {
                <div class="tcc-row">
                  <span><span class="tcc-ico" aria-hidden="true">✈️</span><span i18n="@@tripCost.flights">Vuelos (ida, vuelta y entre ciudades)</span></span>
                  <b>{{ cost.format(est.flightsUsd) }}</b>
                </div>
                <div class="tcc-row">
                  <span><span class="tcc-ico" aria-hidden="true">🏨</span><span i18n="@@tripCost.lodging">Alojamiento · {{ est.nights }} noches · {{ est.rooms }} hab.</span></span>
                  <b>{{ cost.format(est.lodgingUsd) }}</b>
                </div>
                <div class="tcc-row">
                  <span>
                    <span class="tcc-ico" aria-hidden="true">🎟️</span>
                    @if (est.ticketCount === 1) {
                      <span i18n="@@tripCost.ticketsOne">Entradas · 1 atracción</span>
                    } @else {
                      <span i18n="@@tripCost.tickets">Entradas · {{ est.ticketCount }} atracciones</span>
                    }
                    @if (est.unpricedTicketCount > 0) {
                      <span class="tcc-sub" i18n="@@tripCost.unpricedTickets">· {{ est.unpricedTicketCount }} sin precio</span>
                    }
                  </span>
                  <b>{{ cost.format(est.ticketsUsd) }}</b>
                </div>
                <div class="tcc-row">
                  <span><span class="tcc-ico" aria-hidden="true">🚌</span><span i18n="@@tripCost.groundTransport">Buses y trenes</span></span>
                  <b>{{ cost.format(est.groundUsd) }}</b>
                </div>
              }
              @for (leg of est.unestimated; track $index) {
                @if (leg.mode === 'hotel') {
                  <div class="tcc-row tcc-row--na">
                    <span><span class="tcc-ico" aria-hidden="true">🏨</span><span i18n="@@tripCost.hotelGap">{{ cityName(leg.from, settings()) }} · alojamiento — sin estimar</span></span>
                  </div>
                } @else {
                  <div class="tcc-row tcc-row--na">
                    <span><span class="tcc-ico" aria-hidden="true">{{ legIcon(leg.mode) }}</span>{{ cityName(leg.from, settings()) }} → {{ cityName(leg.to, settings()) }}</span>
                    <b i18n="@@tripCost.unestimated">sin estimar</b>
                  </div>
                }
              }
            </div>
          }

          <button type="button" class="tcc-toggle" [attr.aria-expanded]="open()" (click)="open.set(!open())">
            @if (open()) {
              <span i18n="@@tripCost.hideDetail">Ocultar detalle ▲</span>
            } @else {
              <span i18n="@@tripCost.showDetail">Ver detalle ▼</span>
            }
          </button>
        } @else {
          <div class="tcc-status" i18n="@@tripCost.notCalculated">Todavía no calculado</div>
          @if (canCalculate()) {
            <button type="button" class="tcc-btn" (click)="calculate.emit()" i18n="@@tripCost.calculateBtn">Calcular precio</button>
          }
        }

        @if (mode() === 'owner' && canCalculate() && !calculating()) {
          <button type="button" class="tcc-link tcc-edit" (click)="editSettings.emit()"
                  i18n="@@tripCost.editSettings">Editar salida, viajeros y estilo</button>
        }
      </section>
    }
  `,
  styles: [`
    .tcc {
      background: linear-gradient(135deg, var(--mint), var(--sky));
      border-radius: 16px; padding: 14px 16px; min-width: 0;
      display: flex; flex-direction: column; gap: 2px;
      font-size: 12px; line-height: 1.4; color: var(--t1); text-align: left;
    }
    .tcc--empty { background: var(--cream); border: 1px dashed var(--border); }
    .tcc-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--mint-d); }
    .tcc--empty .tcc-title { color: var(--t2); }
    .tcc-status { color: var(--t2); margin-top: 2px; }
    .tcc-total {
      font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.15; margin-top: 2px;
      font-variant-numeric: tabular-nums; overflow-wrap: anywhere; transition: opacity .2s;
    }
    .tcc-code { font-size: 12px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
    .tcc-total--stale { opacity: .45; }
    .tcc-context { color: var(--t2); }
    .tcc-meta { font-size: 11px; color: var(--t2); margin-top: 4px; }
    .tcc-stale-msg { font-size: 11px; font-weight: 600; color: var(--t1); }
    .tcc-missing { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; color: var(--t2); }
    .tcc-rows {
      margin-top: 8px; padding-top: 6px; display: flex; flex-direction: column; gap: 2px;
      border-top: 1px solid color-mix(in oklch, var(--sky-d) 30%, transparent);
    }
    .tcc-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 2px 0; color: var(--t2); }
    .tcc-row b { color: var(--t1); font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .tcc-row--na b { color: var(--t2); font-weight: 500; font-style: italic; }
    .tcc-ico { margin-right: 5px; }
    .tcc-glyph { margin-right: 4px; }
    .tcc-sub { color: var(--t2); }
    .tcc-link, .tcc-toggle {
      background: none; border: none; padding: 0; font: inherit; font-size: 12px; font-weight: 600;
      color: var(--lav-d); cursor: pointer; text-align: left; align-self: flex-start; min-height: 32px;
    }
    .tcc-link:hover, .tcc-toggle:hover { text-decoration: underline; text-underline-offset: 3px; }
    .tcc-btn {
      width: 100%; min-height: 40px; margin-top: 8px; border: 1px dashed var(--border); border-radius: 999px;
      background: transparent; color: var(--t1); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .tcc-btn:hover { border-color: var(--lav-d); color: var(--lav-d); }
    .tcc--slim { padding: 0; gap: 0; }
    .tcc--slim .tcc-btn { width: auto; margin: 0 12px 10px; }
    .tcc-bar, .tcc-head {
      display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: none;
      font: inherit; color: inherit; text-align: left; cursor: pointer;
    }
    .tcc-bar { min-height: 44px; padding: 8px 14px; flex-wrap: wrap; row-gap: 0; }
    .tcc-bar-title { flex-basis: 100%; }
    .tcc-head { min-height: 32px; padding: 0; margin: -4px 0 0; }
    .tcc-bar-total { font-size: 17px; font-weight: 700; letter-spacing: -.01em; font-variant-numeric: tabular-nums; transition: opacity .2s; }
    .tcc-flag {
      font-size: 10px; font-weight: 600; color: var(--t1); padding: 2px 8px; border-radius: 999px;
      background: color-mix(in oklch, var(--cream) 70%, transparent);
    }
    .tcc-chev { margin-left: auto; font-size: 10px; color: var(--lav-d); transition: transform .2s ease-out; }
    .tcc-bar:hover .tcc-chev { transform: translateY(1px); }
    .tcc-head:hover .tcc-chev { transform: translateY(-1px); }
    @media (prefers-reduced-motion: reduce) { .tcc-chev, .tcc-total, .tcc-bar-total { transition: none; } }
    .tcc button:focus-visible { outline: 2px solid var(--lav-d); outline-offset: 2px; border-radius: 8px; }
    .tcc .tcc-bar:focus-visible { outline-offset: -3px; border-radius: 16px; }
    .tcc .tcc-btn:focus-visible { border-radius: 999px; }
  `],
})
export class TripCostCardComponent {
  readonly cost = inject(TripCostService);
  private readonly locale = inject(LOCALE_ID);

  readonly estimate     = input<CostCardEstimate | null>(null);
  readonly settings     = input<CostCardSettings | null>(null);
  readonly mode         = input<'owner' | 'shared'>('owner');
  readonly canCalculate = input(false);
  readonly calculating  = input(false);

  readonly calculate    = output<void>();
  readonly editSettings = output<void>();

  readonly open = signal(false);
  /** Editor (owner mode) starts as one slim row on every load; the shared page ignores this. */
  readonly collapsed = signal(true);

  /** Stale snapshots are only flagged to the owner; shared viewers never receive one. */
  readonly isStale = computed(() => this.mode() === 'owner' && !!this.estimate()?.stale);

  readonly calculatedDate = computed(() => {
    const at = this.estimate()?.calculatedAt;
    return at ? formatDate(at, 'd MMM y', this.locale) : '';
  });

  legIcon(mode: string): string {
    return mode === 'flight' ? '✈️' : mode === 'boat' ? '⛴️' : '🚌';
  }

  /** City id to display name; '__home__' is the origin name, or "Casa" when there is none. */
  cityName(id: string, s: CostCardSettings | null): string {
    if (id === '__home__') return s?.origin?.name ?? $localize`:@@tripCost.home:Casa`;
    // AI-made cities can sit outside the catalog; never show their internal id to the user.
    return WORLD_CITIES.find(c => c.id === id)?.name ?? $localize`:@@tripCost.uncataloguedCity:Ciudad sin catálogo`;
  }
}
