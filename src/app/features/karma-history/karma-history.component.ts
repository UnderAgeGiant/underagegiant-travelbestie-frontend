import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/api/api.service';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';
import { TripService } from '../trip/trip.service';
import { AutoSaveService } from '../../core/saved-plans/auto-save.service';
import { ToastComponent } from '../../shared/toast/toast.component';
import { KarmaEvent, karmaReasonLabel, isPlanLinkedReason } from '../../core/models/karma-event.model';
import { TripStop, TransitLeg } from '../../core/models/trip.model';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-karma-history',
  imports: [NavShellComponent, ProfileComponent, DatePipe, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile-page">
      <app-nav [activeView]="'karmahistory'" (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />

      @if (showProfile()) {
        <app-profile (close)="showProfile.set(false)" />
      }

      <div class="prof-bar">
        <button class="back-btn" (click)="goHome()" type="button" i18n="@@karmaHistory.backBtn">← Volver</button>
        <div class="prof-bar-title" i18n="@@karmaHistory.title">Historial de karma</div>
      </div>

      <div class="prof-body">
        <section>
          @if (loadError() && events().length === 0) {
            <div class="section-empty">
              <p i18n="@@karmaHistory.loadError">No pudimos cargar tu historial de karma.</p>
              <button class="btn-pill btn-outline" (click)="retry()" type="button" i18n="@@karmaHistory.retry">Reintentar</button>
            </div>
          } @else if (loading() && events().length === 0) {
            <div class="section-empty" i18n="@@karmaHistory.loading">Cargando tu historial…</div>
          } @else if (events().length === 0) {
            <div class="section-empty" i18n="@@karmaHistory.empty">Aún no tienes movimientos de karma.</div>
          } @else {
            <div class="karma-history-list">
              @for (event of events(); track event.eventId) {
                <div class="karma-history-row">
                  <div class="karma-history-main">
                    <span class="karma-history-label">{{ karmaReasonLabel(event.reason) }}</span>
                    @if (event.target?.name) {
                      <span class="karma-history-plan-name">{{ event.target!.name }}</span>
                    } @else if (event.target === null && isPlanLinkedReason(event.reason)) {
                      <span class="karma-history-plan-name karma-history-plan-deleted" i18n="@@karmaHistory.planDeleted">Plan borrado</span>
                    }
                    @if (event.reason === 'karma_purchased' && event.purchase) {
                      <span class="karma-history-purchase-meta">
                        <ng-container i18n="@@karmaHistory.purchaseProvider">Proveedor</ng-container>: {{ event.purchase.provider }} ·
                        <ng-container i18n="@@karmaHistory.purchaseTransactionId">ID de transacción</ng-container>: {{ event.purchase.transactionId }}
                      </span>
                    }
                    <span class="karma-history-date">{{ event.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <span class="karma-history-delta" [class.karma-history-delta-pos]="event.delta > 0">
                    {{ event.delta > 0 ? '+' : '' }}{{ event.delta }} ✨
                  </span>
                  @if (event.target?.type === 'trip') {
                    <button class="btn-pill btn-outline karma-history-action" (click)="goToTrip(event.target!.id)" type="button"
                            i18n="@@karmaHistory.goToTrip">Ir al viaje</button>
                  } @else if (event.target?.type === 'ai_plan_request') {
                    <button class="btn-pill btn-outline karma-history-action" (click)="goToAiPlan()" type="button"
                            i18n="@@karmaHistory.goToAiPlan">Ir al plan de IA</button>
                  }
                </div>
              }
            </div>
            @if (nextCursor()) {
              <button class="btn-pill btn-ghost karma-history-load-more" [disabled]="loading()" (click)="loadMore()" type="button">
                {{ loading() ? '⏳' : '' }} <ng-container i18n="@@karmaHistory.loadMore">Cargar más</ng-container>
              </button>
            }
          }
        </section>
      </div>
    </div>

    @if (toast()) {
      <app-toast [message]="toast()!" (done)="toast.set(null)" />
    }
  `,
})
export class KarmaHistoryComponent implements OnInit {
  private readonly router     = inject(Router);
  private readonly auth       = inject(AuthService);
  private readonly api        = inject(ApiService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly trip       = inject(TripService);
  private readonly autoSave   = inject(AutoSaveService);
  private readonly facade     = inject(NavFacadeService);

  readonly showProfile = signal(false);
  readonly events      = signal<KarmaEvent[]>([]);
  readonly nextCursor  = signal<string | null>(null);
  readonly loading     = signal(false);
  readonly loadError   = signal(false);
  readonly toast       = signal<string | null>(null);

  readonly karmaReasonLabel = karmaReasonLabel;
  readonly isPlanLinkedReason = isPlanLinkedReason;

  ngOnInit(): void {
    this.loadPage(null);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (cursor) this.loadPage(cursor);
  }

  private loadPage(cursor: string | null): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    this.loading.set(true);
    if (cursor === null) this.loadError.set(false);
    this.api.getKarmaEvents(email, cursor, PAGE_SIZE).subscribe({
      next: page => {
        this.events.update(existing => cursor ? [...existing, ...page.events] : page.events);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (cursor === null) {
          // First-load failure: nothing loaded yet, so show the full error state.
          this.loadError.set(true);
        } else {
          // "Cargar más" failure: keep already-loaded rows visible and the cursor intact
          // so the same button can be clicked again, and surface the failure via toast.
          this.toast.set($localize`:@@karmaHistory.loadMoreError:No pudimos cargar más eventos`);
        }
      },
    });
  }

  retry(): void {
    this.loadError.set(false);
    this.loadPage(null);
  }

  goToTrip(tripId: string): void {
    const plan = this.savedPlans.plans().find(p => p.id === tripId);
    if (plan) {
      this.enterTrip(plan.stops, plan.id, plan.transits ?? [], plan.isCollaborator, plan.ownerName, plan.ownerEmail);
      return;
    }
    // savedPlans.plans() can be stale (e.g. trip created in another tab); the backend has
    // already confirmed this trip exists and is owned by the caller before sending this
    // target at all, so retry once against a fresh trip list before giving up.
    this.api.getTrips().subscribe({
      next: trips => {
        const found = trips.find(t => t.id === tripId);
        if (found) {
          this.enterTrip(found.stops, found.id!, found.transits ?? [], found.isCollaborator, found.ownerName, found.ownerEmail);
        } else {
          this.toast.set($localize`:@@karmaHistory.tripNotFound:No se pudo abrir el viaje`);
        }
      },
      error: () => this.toast.set($localize`:@@karmaHistory.tripNotFound:No se pudo abrir el viaje`),
    });
  }

  private enterTrip(
    stops: TripStop[], id: string, transits: TransitLeg[],
    isCollaborator: boolean | undefined, ownerName: string | undefined, ownerEmail: string | undefined,
  ): void {
    const owner = isCollaborator ? { name: ownerName!, email: ownerEmail! } : null;
    this.trip.restoreStops(stops, id, transits, owner);
    if (stops.length > 0) this.trip.setActive(stops[0].stopId);
    this.autoSave.commitSnapshot(id);
    if (owner && !this.autoSave.enabled()) this.autoSave.showReminderNow();
    this.router.navigate(['/']);
  }

  goToAiPlan(): void {
    this.facade.openMyTrips('aiplans');
  }
}
