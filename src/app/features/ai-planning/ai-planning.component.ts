import { Component, inject, signal, computed, output } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripSuggestion, SuggestTripsResponse } from '../../core/models/ai.model';
import { Trip, TransitLeg, TransitSegment, TransitMode } from '../../core/models/trip.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { NavComponent } from '../nav/nav.component';
import { ProfileComponent } from '../profile/profile.component';

type Step = 'preferences' | 'options' | 'result';

@Component({
  selector: 'app-ai-planning',
  standalone: true,
  imports: [DurationPipe, NavComponent, ProfileComponent],
  template: `
    <div class="ai-plan-page">

      <div class="shared-bg"></div>
      <div class="shared-bg-frost"></div>

      <app-nav (logoClick)="close.emit()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)"
                     (openAiPlanning)="showProfile.set(false)" />
      }

      <div class="shared-body">

        @if (!auth.isLoggedIn()) {
          <!-- Auth gate -->
          <div class="ai-plan-gate">
            <div style="font-size:48px;margin-bottom:12px">🔒</div>
            <div style="font-size:18px;font-weight:600;color:var(--t1);margin-bottom:6px"
                 i18n="@@aiplan.authTitle">Inicia sesión para continuar</div>
            <div style="font-size:13px;color:var(--t3)"
                 i18n="@@aiplan.authDesc">Debes iniciar sesión para usar el planificador IA.</div>
          </div>

        } @else {

          <!-- Header -->
          <div class="shared-header">
            <div class="shared-header-name" i18n="@@aiplan.title">Tu próximo viaje, diseñado por IA</div>
            <div class="shared-header-owner" i18n="@@aiplan.subtitle">Cuéntanos qué buscas y generamos opciones personalizadas para ti</div>
            <div class="ai-plan-karma-note" i18n="@@aiplan.karmaCost">Esta acción cuesta 10 karma ⭐ en total</div>
          </div>

          <!-- Step indicator -->
          <div class="ai-plan-steps">
            <div class="ai-plan-step" [class.active]="step() === 'preferences'" [class.done]="step() !== 'preferences'">
              <span class="ai-plan-step-n">1</span>
              <span i18n="@@aiplan.step1">Preferencias</span>
            </div>
            <div class="ai-plan-step-line"></div>
            <div class="ai-plan-step" [class.active]="step() === 'options'" [class.done]="step() === 'result'">
              <span class="ai-plan-step-n">2</span>
              <span i18n="@@aiplan.step2">Elige opción</span>
            </div>
            <div class="ai-plan-step-line"></div>
            <div class="ai-plan-step" [class.active]="step() === 'result'">
              <span class="ai-plan-step-n">3</span>
              <span i18n="@@aiplan.step3">Tu plan</span>
            </div>
          </div>

          @if (error()) {
            <div class="ai-plan-error">⚠️ {{ error() }}</div>
          }

          <!-- ── Step 1: Preferences form ── -->
          @if (step() === 'preferences') {
            <div class="ai-plan-card">
              <div class="ai-plan-card-title" i18n="@@aiplan.prefTitle">¿Qué tipo de viaje buscas?</div>

              <div class="ai-plan-field">
                <label class="ai-plan-label" i18n="@@aiplan.prefLabel">Describe tu viaje ideal</label>
                <textarea class="ai-plan-textarea"
                          [value]="preferences()"
                          (input)="preferences.set($any($event.target).value)"
                          rows="4"
                          i18n-placeholder="@@aiplan.prefPlaceholder"
                          placeholder="Ej: quiero un viaje romántico con mi pareja, priorizando gastronomía y museos, sin demasiado transporte…"
                          ></textarea>
              </div>

              <div class="ai-plan-row">
                <div class="ai-plan-field">
                  <label class="ai-plan-label" i18n="@@aiplan.durationLabel">Duración (días)</label>
                  <input class="form-input"
                         type="number" min="1" max="90"
                         [value]="duration() ?? ''"
                         (input)="setDuration($any($event.target).value)"
                         i18n-placeholder="@@aiplan.durationPlaceholder"
                         placeholder="Ej: 14" />
                </div>
                <div class="ai-plan-field">
                  <label class="ai-plan-label" i18n="@@aiplan.budgetLabel">Presupuesto estimado</label>
                  <input class="form-input"
                         type="text"
                         [value]="budget()"
                         (input)="budget.set($any($event.target).value)"
                         i18n-placeholder="@@aiplan.budgetPlaceholder"
                         placeholder="Ej: 500-1000 USD" />
                </div>
              </div>

              <div class="ai-plan-field">
                <label class="ai-plan-label" i18n="@@aiplan.startDateLabel">Fecha de inicio (dd/mm/aaaa)</label>
                <input class="form-input"
                       type="text" maxlength="10"
                       [value]="startDate()"
                       (input)="startDate.set($any($event.target).value)"
                       i18n-placeholder="@@aiplan.startDatePlaceholder"
                       placeholder="Ej: 15/07/2026" />
              </div>

              <button class="btn-pill btn-primary ai-plan-submit"
                      [disabled]="loading() || !preferences().trim()"
                      (click)="suggest()"
                      type="button">
                @if (loading()) { ⏳ } @else { ✨ }
                <span i18n="@@aiplan.suggestBtn">Generar opciones</span>
              </button>
            </div>
          }

          <!-- ── Step 2: Pick a suggestion ── -->
          @if (step() === 'options') {
            <div class="ai-plan-card">
              <div class="ai-plan-card-title" i18n="@@aiplan.optTitle">Elige una opción</div>
              <div class="ai-options">
                @for (opt of suggestions()!.options; track opt.id) {
                  <div class="ai-option-card"
                       [class.ai-option-selected]="selectedOption()?.id === opt.id"
                       (click)="selectedOption.set(opt)">
                    <div class="ai-option-title">{{ opt.title }}</div>
                    <div class="ai-option-summary">{{ opt.summary }}</div>
                    <div class="ai-option-highlights">
                      @for (h of opt.highlights; track h) {
                        <span class="ai-option-hl">{{ h }}</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="ai-plan-actions">
                <button class="btn-pill btn-outline"
                        (click)="step.set('preferences')"
                        type="button"
                        i18n="@@aiplan.backBtn">← Volver</button>
                <button class="btn-pill btn-primary"
                        [disabled]="loading() || !selectedOption()"
                        (click)="plan()"
                        type="button">
                  @if (loading()) { ⏳ } @else { 🗺️ }
                  <span i18n="@@aiplan.planBtn">Generar plan completo</span>
                </button>
              </div>
            </div>
          }

          <!-- ── Step 3: View & save result ── -->
          @if (step() === 'result' && generatedTrip()) {
            <div class="ai-plan-result-header">
              <div class="ai-plan-result-title">{{ generatedTrip()!.title }}</div>
              <div class="ai-plan-result-stops">
                @for (stop of generatedTrip()!.stops; track stop.cityId) {
                  @let city = cityFor(stop.cityId);
                  @if (city) {
                    <span class="shared-header-flag" [title]="city.name">{{ city.flag }}</span>
                  }
                }
              </div>
            </div>

            <div class="itin">

              <!-- Departure -->
              @let dep = legFor('__start__', '__start__');
              @if (dep) {
                <div class="itin-transit itin-edge-transit">
                  <span class="itin-transit-tag" i18n="@@aiplan.departure">Salida 🏠</span>
                  @for (seg of dep.segments; track $index; let sl = $last) {
                    <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                    @if (!sl) { <span class="itin-chain">↓</span> }
                  }
                  @if (dep.segments.length > 1) {
                    <span class="itin-transit-total">Total: {{ fmtDur(totalMins(dep)) }}</span>
                  }
                </div>
                <div class="itin-line"></div>
              }

              @for (stop of generatedTrip()!.stops; track stop.stopId; let i = $index; let last = $last) {
                @let city = cityFor(stop.cityId);
                @if (city) {
                  <div class="itin-city">
                    <div class="itin-city-head">
                      <span class="itin-city-flag">{{ city.flag }}</span>
                      <div>
                        <div class="itin-city-name">{{ city.name }}</div>
                        <div class="itin-city-country">{{ city.country }}</div>
                        @if (stop.checkIn) {
                          <div class="itin-city-dates">{{ stop.checkIn }} → {{ stop.checkOut }}</div>
                        }
                      </div>
                    </div>

                    @if (stop.lodging || stop.selectedAttractions.length > 0) {
                      <div class="itin-items">
                        @if (stop.lodging) {
                          <div class="itin-item itin-item-lodging">
                            <span class="itin-item-icon">🏨</span>
                            <span class="itin-item-label">{{ stop.lodging.name }}</span>
                            @if (stop.lodging.url) {
                              <a class="itin-link" [href]="stop.lodging.url"
                                 target="_blank" rel="noopener noreferrer"
                                 (click)="$event.stopPropagation()">🔗</a>
                            }
                          </div>
                        }
                        @for (planned of stop.selectedAttractions; track planned.attractionId) {
                          @let att = attFor(stop.cityId, planned.attractionId);
                          @if (att) {
                            @let attDate = planned.date || stop.checkIn;
                            <div class="itin-item">
                              <span class="itin-item-icon">{{ att.icon }}</span>
                              <span class="itin-item-label">{{ att.name }}</span>
                              <span class="itin-item-meta">
                                @if (attDate) { {{ shortDate(attDate) }} · }{{ planned.startTime }} · {{ att.estimatedMinutes | duration }}
                              </span>
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>

                  @if (!last) {
                    @let nextStop = generatedTrip()!.stops[i + 1];
                    @let leg = legFor(stop.cityId, nextStop.cityId);
                    @let nextCity = cityFor(nextStop.cityId);
                    <div class="itin-line"></div>
                    <div class="itin-transit">
                      @if (leg) {
                        @for (seg of leg.segments; track $index; let sl = $last) {
                          <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                          @if (!sl) { <span class="itin-chain">↓</span> }
                        }
                        @if (leg.segments.length > 1) {
                          <span class="itin-transit-total">Total: {{ fmtDur(totalMins(leg)) }}</span>
                        }
                      } @else {
                        <span class="itin-no-transit" i18n="@@aiplan.noTransit">Sin transporte definido</span>
                      }
                      @if (nextCity) {
                        <span class="itin-transit-dest">→ {{ nextCity.flag }} {{ nextCity.name }}</span>
                      }
                    </div>
                    <div class="itin-line"></div>
                  } @else {
                    @let ret = legFor('__end__', '__end__');
                    @if (ret) {
                      <div class="itin-line"></div>
                      <div class="itin-transit itin-edge-transit">
                        <span class="itin-transit-tag" i18n="@@aiplan.return">Vuelta 🏠</span>
                        @for (seg of ret.segments; track $index; let sl = $last) {
                          <span class="itin-seg">{{ fmtSeg(seg) }}</span>
                          @if (!sl) { <span class="itin-chain">↓</span> }
                        }
                        @if (ret.segments.length > 1) {
                          <span class="itin-transit-total">Total: {{ fmtDur(totalMins(ret)) }}</span>
                        }
                      </div>
                    }
                  }
                }
              }
            </div>

            <div class="ai-plan-actions" style="margin-top:24px">
              <button class="btn-pill btn-outline"
                      (click)="reset()"
                      type="button"
                      i18n="@@aiplan.restartBtn">↩ Volver a empezar</button>
              <button class="btn-pill btn-primary"
                      (click)="save()"
                      type="button"
                      i18n="@@aiplan.saveBtn">💾 Guardar plan</button>
            </div>
          }

        }
      </div>

      @if (loading()) {
        <div class="ai-loading-overlay">
          <div class="ai-loading-card">
            <div class="ai-loading-spinner"></div>
            <div class="ai-loading-title">{{ loadingMessage() }}</div>
            <div class="ai-loading-sub" i18n="@@aiplan.loadingSub">Esto puede tardar unos segundos…</div>
          </div>
        </div>
      }

    </div>
  `,
})
export class AiPlanningComponent {
  close     = output<void>();
  planSaved = output<void>();

  readonly auth = inject(AuthService);
  private readonly api        = inject(ApiService);
  private readonly tripSvc    = inject(TripService);
  private readonly savedPlans = inject(SavedPlansService);

  showProfile     = signal(false);
  step            = signal<Step>('preferences');
  loading         = signal(false);
  loadingMessage  = signal('');
  error          = signal<string | null>(null);
  suggestions    = signal<SuggestTripsResponse | null>(null);
  selectedOption = signal<TripSuggestion | null>(null);
  generatedTrip  = signal<Trip | null>(null);

  preferences = signal('');
  duration    = signal<number | undefined>(undefined);
  budget      = signal('');
  startDate   = signal('');

  private readonly transitMap = computed(() => {
    const map = new Map<string, TransitLeg>();
    for (const t of this.generatedTrip()?.transits ?? []) {
      map.set(`${t.fromCityId}|${t.toCityId}`, t);
    }
    return map;
  });

  setDuration(val: string): void {
    const n = parseInt(val, 10);
    this.duration.set(isNaN(n) ? undefined : n);
  }

  suggest(): void {
    if (!this.preferences().trim()) return;
    this.loadingMessage.set($localize`:@@aiplan.loadingSuggest:Generando sugerencias ✨`);
    this.loading.set(true);
    this.error.set(null);
    this.api.suggestTrips(this.preferences(), this.duration(), this.budget() || undefined)
      .subscribe({
        next: res => {
          this.suggestions.set(res);
          this.selectedOption.set(res.options[0]);
          this.loading.set(false);
          this.step.set('options');
        },
        error: err => {
          this.error.set(err?.error?.error ?? 'Error al generar sugerencias');
          this.loading.set(false);
        },
      });
  }

  plan(): void {
    const opt = this.selectedOption();
    if (!opt) return;
    this.loadingMessage.set($localize`:@@aiplan.loadingPlan:Creando tu plan de viaje 🗺️`);
    this.loading.set(true);
    this.error.set(null);
    this.api.planTrip({
      selectedOption: opt,
      preferences:    this.preferences(),
      duration:       this.duration(),
      budget:         this.budget() || undefined,
      startDate:      this.startDate() || undefined,
    }).subscribe({
      next: trip => {
        this.generatedTrip.set(trip);
        this.loading.set(false);
        this.step.set('result');
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Error al generar el plan');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const trip  = this.generatedTrip();
    const email = this.auth.currentUser()?.email;
    if (!trip || !email) return;
    this.tripSvc.restoreStops(trip.stops, null, trip.transits ?? []);
    this.savedPlans.upsert(email, null, trip.title, trip.stops, trip.transits ?? [])
      .subscribe(() => this.planSaved.emit());
  }

  reset(): void {
    this.step.set('preferences');
    this.generatedTrip.set(null);
    this.suggestions.set(null);
    this.selectedOption.set(null);
    this.error.set(null);
  }

  legFor(from: string, to: string): TransitLeg | null {
    return this.transitMap().get(`${from}|${to}`) ?? null;
  }

  cityFor(cityId: string) {
    return WORLD_CITIES.find(c => c.id === cityId) ?? null;
  }

  attFor(cityId: string, attractionId: string) {
    const city = this.cityFor(cityId);
    if (!city) return null;
    return getAttractions(city).find(a => a.id === attractionId) ?? null;
  }

  shortDate(s: string): string {
    const p = s.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : s;
  }

  computeMins(seg: TransitSegment): number {
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const parse = (d: string, t: string) => {
        const [dd, mm, yyyy] = d.split('/').map(Number);
        const [hh, mi]       = t.split(':').map(Number);
        return new Date(yyyy, mm - 1, dd, hh ?? 0, mi ?? 0).getTime();
      };
      return Math.max(0, Math.round(
        (parse(seg.arrivalDate, seg.arrivalTime) - parse(seg.departureDate, seg.departureTime)) / 60000
      ));
    }
    return seg.durationMinutes ?? 0;
  }

  fmtDur(mins: number): string {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }

  fmtSeg(seg: TransitSegment): string {
    const icons: Record<TransitMode, string> = { flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗' };
    const icon = icons[seg.mode] ?? '🚀';
    let display: string;
    if (seg.departureDate && seg.departureTime && seg.arrivalDate && seg.arrivalTime) {
      const sameDay = seg.departureDate === seg.arrivalDate;
      const arr     = sameDay ? seg.arrivalTime : `${seg.arrivalDate} ${seg.arrivalTime}`;
      display = `${icon} ${seg.departureDate} ${seg.departureTime} → ${arr} (${this.fmtDur(this.computeMins(seg))})`;
    } else {
      display = `${icon} ${this.fmtDur(seg.durationMinutes ?? 0)}`;
    }
    return seg.notes ? `${display} · ${seg.notes}` : display;
  }

  totalMins(leg: TransitLeg): number {
    return leg.segments.reduce((sum, s) => sum + this.computeMins(s), 0);
  }
}
