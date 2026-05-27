import { Component, inject, signal, computed, output } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { TripService } from '../trip/trip.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripSuggestion, SuggestTripsResponse, PlanChangeInfo, PlanSessionOptions } from '../../core/models/ai.model';
import { Trip, TransitLeg, TransitSegment, TransitMode } from '../../core/models/trip.model';
import { isMinorChange, toSessionOptions, FREE_CHANGE_LIMIT } from '../../core/ai/plan-change-detector.util';
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

          @if (karmaError()) {
            <div class="ai-karma-error-card">
              <div class="ai-karma-error-icon">⭐</div>
              <div class="ai-karma-error-title" i18n="@@aiplan.karmaErrTitle">Karma insuficiente</div>
              <div class="ai-karma-error-body">
                <span i18n="@@aiplan.karmaErrNeed">Necesitas</span>
                <strong> {{ karmaError()!.need }} karma </strong>
                <span i18n="@@aiplan.karmaErrHave">para esta acción, pero tienes</span>
                <strong> {{ karmaError()!.have }}</strong>.
              </div>
              <div class="ai-karma-error-tip" i18n="@@aiplan.karmaErrTip">
                💡 Comenta en viajes compartidos de otros usuarios para ganar +1 karma por parada comentada.
              </div>
              <button class="btn-pill btn-outline"
                      (click)="karmaError.set(null)"
                      type="button"
                      i18n="@@aiplan.karmaErrDismiss">Entendido</button>
            </div>
          }

          <!-- ── Change info banners ── -->
          @if (changeWarning()) {
            <div class="ai-change-warn-card">
              <div class="ai-change-warn-icon">🔄</div>
              <div class="ai-change-warn-title" i18n="@@aiplan.minorChangeTitle">Cambio menor detectado</div>
              <div class="ai-change-warn-body">
                <span i18n="@@aiplan.minorChangeBody">Esta modificación es ≤20% del plan original.</span>
                <strong> {{ changeWarning()!.freeChangesRemaining }} </strong>
                <span i18n="@@aiplan.minorChangeFreeLeft">cambios gratuitos restantes.</span>
              </div>
              <button class="btn-pill btn-outline" style="margin-top:8px"
                      (click)="changeWarning.set(null)" type="button"
                      i18n="@@aiplan.changeWarnDismiss">Entendido</button>
            </div>
          }

          @if (changeCharged()) {
            <div class="ai-change-charged-card">
              <div class="ai-change-charged-icon">⭐</div>
              <div class="ai-change-charged-title">
                @if (changeCharged()!.reason === 'major_change') {
                  <span i18n="@@aiplan.majorChangeTitle">Cambio significativo (>20%)</span>
                } @else {
                  <span i18n="@@aiplan.limitReachedTitle">Límite de cambios gratuitos alcanzado</span>
                }
              </div>
              <div class="ai-change-charged-body" i18n="@@aiplan.changeChargedBody">Se descontó 1 karma ⭐ por este cambio.</div>
              <button class="btn-pill btn-outline" style="margin-top:8px"
                      (click)="changeCharged.set(null)" type="button"
                      i18n="@@aiplan.changeChargedDismiss">Entendido</button>
            </div>
          }

          <!-- ── Pre-call change confirmation (plan) ── -->
          @if (planConfirmPending()) {
            <div class="ai-confirm-charge-card">
              <div class="ai-confirm-charge-icon">💸</div>
              <div class="ai-confirm-charge-title">
                @if (planConfirmPending()!.reason === 'major_change') {
                  <span i18n="@@aiplan.confirmMajorTitle">Cambio mayor al 20% detectado</span>
                } @else {
                  <span i18n="@@aiplan.confirmLimitTitle">Has usado tus 3 cambios gratuitos</span>
                }
              </div>
              <div class="ai-confirm-charge-body" i18n="@@aiplan.confirmChargeBody">
                Esta acción costará 1 karma ⭐. ¿Deseas continuar?
              </div>
              <div class="ai-plan-actions">
                <button class="btn-pill btn-outline"
                        (click)="planConfirmPending.set(null)" type="button"
                        i18n="@@aiplan.confirmCancel">Cancelar</button>
                <button class="btn-pill btn-primary"
                        (click)="executePlan()" type="button"
                        i18n="@@aiplan.confirmProceed">Sí, continuar (−1 karma)</button>
              </div>
            </div>
          }

          <!-- ── Pre-suggest change confirmation ── -->
          @if (suggestConfirmPending()) {
            <div class="ai-confirm-charge-card">
              <div class="ai-confirm-charge-icon">💸</div>
              <div class="ai-confirm-charge-title">
                @if (suggestConfirmPending()!.reason === 'major_change') {
                  <span i18n="@@aiplan.confirmMajorTitle">Cambio mayor al 20% detectado</span>
                } @else {
                  <span i18n="@@aiplan.confirmLimitTitle">Has usado tus 3 cambios gratuitos</span>
                }
              </div>
              <div class="ai-confirm-charge-body" i18n="@@aiplan.suggestConfirmBody">
                Si regeneras las opciones con este ajuste, el plan resultante costará 1 karma ⭐. ¿Quieres continuar?
              </div>
              <div class="ai-plan-actions">
                <button class="btn-pill btn-outline"
                        (click)="suggestConfirmPending.set(null)" type="button"
                        i18n="@@aiplan.confirmCancel">Cancelar</button>
                <button class="btn-pill btn-primary"
                        (click)="executeSuggest()" type="button"
                        i18n="@@aiplan.suggestConfirmProceed">Sí, regenerar opciones</button>
              </div>
            </div>
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

              <!-- ── Live 20% change preview (shown when adjusting an active session) ── -->
              @if (planChangePreview() === 'free') {
                <div class="ai-change-preview ai-change-preview-minor">
                  <span>🔄 </span>
                  <span i18n="@@aiplan.previewFreeHint">Ajuste menor —</span>
                  <strong> {{ freeChangesRemaining() }} </strong>
                  <span i18n="@@aiplan.previewFreeLeft">cambio(s) gratuito(s) restante(s) para el plan</span>
                </div>
              }
              @if (planChangePreview() === 'major_change' || planChangePreview() === 'limit_reached') {
                <div class="ai-change-charged-card" style="margin-bottom:4px">
                  <div class="ai-change-charged-icon">💸</div>
                  <div class="ai-change-charged-title">
                    @if (planChangePreview() === 'major_change') {
                      <span i18n="@@aiplan.majorChangeTitle">Cambio significativo (>20%)</span>
                    } @else {
                      <span i18n="@@aiplan.limitReachedTitle">Límite de cambios gratuitos alcanzado</span>
                    }
                  </div>
                  <div class="ai-change-charged-body" i18n="@@aiplan.previewChargedBody">
                    El plan se generará como nueva sesión y costará 1 karma ⭐.
                  </div>
                </div>
              }

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
                <button class="btn-pill btn-outline"
                        (click)="adjustOptions()"
                        type="button"
                        i18n="@@aiplan.adjustBtn">✏️ Ajustar opciones</button>
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
  karmaError      = signal<{ need: number; have: number } | null>(null);
  error           = signal<string | null>(null);
  suggestions     = signal<SuggestTripsResponse | null>(null);
  selectedOption  = signal<TripSuggestion | null>(null);
  generatedTrip   = signal<Trip | null>(null);

  preferences = signal('');
  duration    = signal<number | undefined>(undefined);
  budget      = signal('');
  startDate   = signal('');

  // ── Session management ────────────────────────────────────────────────────
  /** UUID generated on each new suggest call; ties plan calls into a session. */
  planSessionId       = signal<string | null>(null);
  /** Options from the last PAID plan call — baseline for 20% comparison. */
  originalPlanOptions = signal<PlanSessionOptions | null>(null);
  /** Number of free changes used so far in this session. */
  freeChangesUsed     = signal(0);

  // ── Post-plan change feedback ─────────────────────────────────────────────
  changeWarning   = signal<PlanChangeInfo | null>(null);
  changeCharged   = signal<PlanChangeInfo | null>(null);
  /** Pending confirmation: user must confirm a charged re-plan. */
  planConfirmPending = signal<{ reason: 'major_change' | 'limit_reached' } | null>(null);
  /** Pending confirmation: user must confirm re-suggest when plan will be charged. */
  suggestConfirmPending = signal<{ reason: 'major_change' | 'limit_reached' } | null>(null);

  // ── Step 1 live change preview ────────────────────────────────────────────
  /**
   * Shows estimated change type in Step 1 while the user edits preferences.
   * Uses the original selected option as proxy (actual option chosen in Step 2).
   * null when there is no active session to compare against.
   */
  readonly planChangePreview = computed<'free' | 'major_change' | 'limit_reached' | null>(() => {
    const original = this.originalPlanOptions();
    if (!original) return null;
    const cur: PlanSessionOptions = {
      selectedOptionTitle:      original.selectedOptionTitle,
      selectedOptionSummary:    original.selectedOptionSummary,
      selectedOptionHighlights: original.selectedOptionHighlights,
      preferences:              this.preferences(),
      duration:                 this.duration() ?? 0,
      budget:                   this.budget(),
      startDate:                this.startDate(),
    };
    if (!isMinorChange(original, cur)) return 'major_change';
    if (this.freeChangesUsed() >= FREE_CHANGE_LIMIT) return 'limit_reached';
    return 'free';
  });

  /** How many free plan-changes remain in the current session. */
  readonly freeChangesRemaining = computed(() =>
    Math.max(0, FREE_CHANGE_LIMIT - this.freeChangesUsed()),
  );

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

  /**
   * Called when user clicks "Generar opciones".
   * When an active session exists (originalPlanOptions set), pre-validates
   * the 20% threshold against the original options — same logic as plan() —
   * and blocks with a confirmation dialog when the eventual plan call will be charged.
   * On a fresh start (no session) a new planSessionId is generated.
   */
  suggest(): void {
    if (!this.preferences().trim()) return;

    const original = this.originalPlanOptions();
    if (original) {
      // Active session: validate change before re-suggesting
      const cur: PlanSessionOptions = {
        selectedOptionTitle:      original.selectedOptionTitle,
        selectedOptionSummary:    original.selectedOptionSummary,
        selectedOptionHighlights: original.selectedOptionHighlights,
        preferences:              this.preferences(),
        duration:                 this.duration() ?? 0,
        budget:                   this.budget(),
        startDate:                this.startDate(),
      };
      const minor   = isMinorChange(original, cur);
      const freeLeft = this.freeChangesUsed() < FREE_CHANGE_LIMIT;

      if (!minor) {
        this.suggestConfirmPending.set({ reason: 'major_change' });
        return;
      }
      if (!freeLeft) {
        this.suggestConfirmPending.set({ reason: 'limit_reached' });
        return;
      }
      // Minor change within free limit — proceed without confirmation
    } else {
      // Fresh start: generate new session ID
      this.planSessionId.set(crypto.randomUUID());
      this.freeChangesUsed.set(0);
    }

    this.executeSuggest();
  }

  /** Executes the actual /ai/suggest API call. Called from suggest() or the confirm dialog. */
  executeSuggest(): void {
    this.suggestConfirmPending.set(null);
    this.loadingMessage.set($localize`:@@aiplan.loadingSuggest:Generando sugerencias ✨`);
    this.loading.set(true);
    this.error.set(null);
    this.karmaError.set(null);
    this.api.suggestTrips(this.preferences(), this.duration(), this.budget() || undefined)
      .subscribe({
        next: res => {
          this.suggestions.set(res);
          this.selectedOption.set(res.options[0]);
          this.loading.set(false);
          this.step.set('options');
        },
        error: err => {
          this.loading.set(false);
          const karma = this.parseKarmaError(err);
          if (karma) this.karmaError.set(karma);
          else this.error.set(err?.error?.error ?? 'Error al generar sugerencias');
        },
      });
  }

  /**
   * Called when user clicks "Generar plan completo".
   * Pre-validates the 20% threshold on the frontend for UX, then either:
   * - Proceeds directly for new sessions or free minor changes.
   * - Shows a confirmation dialog for changes that will cost karma.
   */
  plan(): void {
    const opt = this.selectedOption();
    if (!opt) return;

    const originalOpts = this.originalPlanOptions();
    if (originalOpts) {
      const currentOpts = toSessionOptions({
        selectedOption: opt,
        preferences:    this.preferences(),
        duration:       this.duration(),
        budget:         this.budget() || undefined,
        startDate:      this.startDate() || undefined,
      });

      const minor = isMinorChange(originalOpts, currentOpts);
      const freeLeft = this.freeChangesUsed() < FREE_CHANGE_LIMIT;

      if (!minor) {
        // Major change — will be charged; ask for confirmation
        this.planConfirmPending.set({ reason: 'major_change' });
        return;
      }
      if (!freeLeft) {
        // Free limit exhausted — will be charged; ask for confirmation
        this.planConfirmPending.set({ reason: 'limit_reached' });
        return;
      }
      // Minor change within free limit — proceed without confirmation
    }

    this.executePlan();
  }

  /** Executes the actual /ai/plan API call. Called from plan() or confirm dialog. */
  executePlan(): void {
    const opt = this.selectedOption();
    if (!opt) return;

    this.planConfirmPending.set(null);
    this.changeWarning.set(null);
    this.changeCharged.set(null);

    this.loadingMessage.set($localize`:@@aiplan.loadingPlan:Creando tu plan de viaje 🗺️`);
    this.loading.set(true);
    this.error.set(null);
    this.karmaError.set(null);

    this.api.planTrip({
      selectedOption: opt,
      preferences:    this.preferences(),
      duration:       this.duration(),
      budget:         this.budget() || undefined,
      startDate:      this.startDate() || undefined,
      planSessionId:  this.planSessionId() ?? undefined,
    }).subscribe({
      next: response => {
        const { changeInfo, ...tripData } = response;
        this.generatedTrip.set(tripData as Trip);
        this.loading.set(false);
        this.step.set('result');

        if (changeInfo) {
          this.handleChangeInfo(changeInfo);
        }
      },
      error: err => {
        this.loading.set(false);
        const karma = this.parseKarmaError(err);
        if (karma) this.karmaError.set(karma);
        else this.error.set(err?.error?.error ?? 'Error al generar el plan');
      },
    });
  }

  /** Updates local session state from the backend's changeInfo response. */
  private handleChangeInfo(info: PlanChangeInfo): void {
    const currentOpt = this.selectedOption();
    if (info.type === 'new_session' || info.type === 'charged_change') {
      // Record new baseline and reset free counter
      if (currentOpt) {
        this.originalPlanOptions.set(toSessionOptions({
          selectedOption: currentOpt,
          preferences:    this.preferences(),
          duration:       this.duration(),
          budget:         this.budget() || undefined,
          startDate:      this.startDate() || undefined,
        }));
      }
      this.freeChangesUsed.set(0);
      if (info.type === 'charged_change') {
        this.changeCharged.set(info);
      }
    } else if (info.type === 'free_change') {
      this.freeChangesUsed.set(info.freeChangesUsed);
      this.changeWarning.set(info);
    }
  }

  /** Goes back to Step 1 (preferences) without resetting the session. */
  adjustOptions(): void {
    this.step.set('preferences');
    this.changeWarning.set(null);
    this.changeCharged.set(null);
    this.planConfirmPending.set(null);
    this.suggestConfirmPending.set(null);
  }

  private parseKarmaError(err: any): { need: number; have: number } | null {
    if (err?.status !== 402) return null;
    const msg: string = err?.error?.error ?? '';
    const match = msg.match(/need (\d+), have (-?\d+)/);
    if (!match) return null;
    return { need: +match[1], have: +match[2] };
  }

  save(): void {
    const trip  = this.generatedTrip();
    const email = this.auth.currentUser()?.email;
    if (!trip || !email) return;
    this.tripSvc.restoreStops(trip.stops, null, trip.transits ?? []);
    this.savedPlans.upsert(email, null, trip.title, trip.stops, trip.transits ?? [])
      .subscribe({
        next: () => this.planSaved.emit(),
        error: err => {
          const k = this.parseKarmaError(err);
          if (k) this.karmaError.set(k);
        },
      });
  }

  reset(): void {
    this.step.set('preferences');
    this.generatedTrip.set(null);
    this.suggestions.set(null);
    this.selectedOption.set(null);
    this.error.set(null);
    this.karmaError.set(null);
    this.planSessionId.set(null);
    this.originalPlanOptions.set(null);
    this.freeChangesUsed.set(0);
    this.changeWarning.set(null);
    this.changeCharged.set(null);
    this.planConfirmPending.set(null);
    this.suggestConfirmPending.set(null);
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
