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
  comfort:  ComfortLevel;
}

/** Works for both CostEstimate and SharedCostEstimate (the latter reduces `settings`). */
export type CostCardEstimate = Omit<CostEstimate, 'settings'>;

/** Estimate card for the stop-panel footer (owner/collaborator) and the shared page (viewers). Presentational only. */
@Component({
  selector: 'app-trip-cost-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'owner' || estimate()) {
      <section class="tcc" [class.tcc-stale]="isStale()">
        @if (mode() === 'shared') {
          <div class="tcc-title" i18n="@@tripCost.sharedTitle">Costo estimado para este grupo</div>
        } @else {
          <div class="tcc-title" i18n="@@tripCost.title">Costo estimado del viaje</div>
        }

        @if (calculating()) {
          <div class="tcc-status" i18n="@@tripCost.calculating">Calculando…</div>
        } @else if (estimate(); as est) {
          <div class="tcc-total" [class.tcc-total--stale]="isStale()">≈ {{ cost.format(est.totalUsd) }}</div>

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
              ·
              @switch (s.comfort) {
                @case ('budget') { <span i18n="@@costSettings.budget">Económico</span> }
                @case ('mid') { <span i18n="@@costSettings.mid">Intermedio</span> }
                @case ('luxury') { <span i18n="@@costSettings.luxury">Lujo</span> }
              }
            </div>
          }

          <div class="tcc-meta"><span i18n="@@tripCost.infoGlyph">ⓘ</span> <span i18n="@@tripCost.calculatedOn">Calculado el {{ calculatedDate() }} · aproximado, ±30%</span></div>

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

          @for (leg of est.unestimated; track $index) {
            @if (leg.mode === 'hotel') {
              <div class="tcc-gap"><span i18n="@@tripCost.hotelGap">{{ cityName(leg.from, settings()) }} · alojamiento — sin estimar</span></div>
            } @else {
              <div class="tcc-gap">{{ cityName(leg.from, settings()) }} → {{ cityName(leg.to, settings()) }} · <span i18n="@@tripCost.unestimated">sin estimar</span></div>
            }
          }

          <button type="button" class="tcc-toggle" [attr.aria-expanded]="open()" (click)="open.set(!open())"
                  i18n="@@tripCost.breakdown">Desglose</button>

          @if (open()) {
            <div class="tcc-breakdown">
              <div class="tcc-line"><span i18n="@@tripCost.flights">Vuelos</span><span>{{ cost.format(est.flightsUsd) }}</span></div>
              <div class="tcc-line">
                <span i18n="@@tripCost.lodging">Alojamiento · {{ est.nights }} noches · {{ est.rooms }} hab.</span>
                <span>{{ cost.format(est.lodgingUsd) }}</span>
              </div>
              <div class="tcc-line">
                <span i18n="@@tripCost.tickets">Entradas · {{ est.ticketCount }}</span>
                <span>
                  {{ cost.format(est.ticketsUsd) }}
                  @if (est.unpricedTicketCount > 0) {
                    <span class="tcc-sub" i18n="@@tripCost.unpricedTickets">· {{ est.unpricedTicketCount }} sin precio</span>
                  }
                </span>
              </div>
              <div class="tcc-line"><span i18n="@@tripCost.groundTransport">Buses y trenes</span><span>{{ cost.format(est.groundUsd) }}</span></div>
            </div>
          }
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
    .tcc { background: #fff; border: 1.5px solid var(--mint-d); border-radius: 16px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--t1); }
    .tcc-title { font-size: 11px; font-weight: 700; color: var(--t2); letter-spacing: .2px; }
    .tcc-status { color: var(--t3); }
    .tcc-total { font-size: 20px; font-weight: 800; color: var(--mint-d); transition: opacity .2s; }
    .tcc-total--stale { opacity: .45; }
    .tcc-context { color: var(--t2); line-height: 1.35; }
    .tcc-meta, .tcc-stale-msg { font-size: 11px; color: var(--t3); line-height: 1.35; }
    .tcc-stale-msg { color: var(--t2); font-weight: 600; }
    .tcc-missing { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; color: var(--t2); }
    .tcc-gap { font-size: 11px; color: var(--t3); }
    .tcc-btn, .tcc-link, .tcc-toggle {
      background: none; border: none; padding: 0; font: inherit; cursor: pointer; text-align: left;
      color: var(--sky-d); font-weight: 600; min-height: 32px; align-self: flex-start;
    }
    .tcc-btn { background: var(--sky); border-radius: 99px; padding: 4px 12px; }
    .tcc-breakdown { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border); padding-top: 6px; }
    .tcc-line { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--t2); }
    .tcc-sub { font-size: 11px; color: var(--t3); }
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

  /** Stale snapshots are only flagged to the owner; shared viewers never receive one. */
  readonly isStale = computed(() => this.mode() === 'owner' && !!this.estimate()?.stale);

  readonly calculatedDate = computed(() => {
    const at = this.estimate()?.calculatedAt;
    return at ? formatDate(at, 'd MMM y', this.locale) : '';
  });

  /** City id to display name; '__home__' is the origin name, or "Casa" when there is none. */
  cityName(id: string, s: CostCardSettings | null): string {
    if (id === '__home__') return s?.origin?.name ?? $localize`:@@tripCost.home:Casa`;
    // AI-made cities can sit outside the catalog; never show their internal id to the user.
    return WORLD_CITIES.find(c => c.id === id)?.name ?? $localize`:@@tripCost.uncataloguedCity:Ciudad sin catálogo`;
  }
}
