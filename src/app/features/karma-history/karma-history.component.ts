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
import { ToastComponent } from '../../shared/toast/toast.component';
import { KarmaEvent, karmaReasonLabel } from '../../core/models/karma-event.model';

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
          @if (loading() && events().length === 0) {
            <div class="section-empty" i18n="@@karmaHistory.loading">Cargando tu historial…</div>
          } @else if (events().length === 0) {
            <div class="section-empty" i18n="@@karmaHistory.empty">Aún no tienes movimientos de karma.</div>
          } @else {
            <div class="karma-history-list">
              @for (event of events(); track event.eventId) {
                <div class="karma-history-row">
                  <div class="karma-history-main">
                    <span class="karma-history-label">{{ karmaReasonLabel(event.reason) }}</span>
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
  private readonly facade     = inject(NavFacadeService);

  readonly showProfile = signal(false);
  readonly events      = signal<KarmaEvent[]>([]);
  readonly nextCursor  = signal<string | null>(null);
  readonly loading     = signal(false);
  readonly toast       = signal<string | null>(null);

  readonly karmaReasonLabel = karmaReasonLabel;

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
    this.api.getKarmaEvents(email, cursor, PAGE_SIZE).subscribe({
      next: page => {
        this.events.update(existing => cursor ? [...existing, ...page.events] : page.events);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  goToTrip(tripId: string): void {
    const plan = this.savedPlans.plans().find(p => p.id === tripId);
    if (!plan) {
      this.toast.set($localize`:@@karmaHistory.tripNotFound:No se pudo abrir el viaje`);
      return;
    }
    const owner = plan.isCollaborator ? { name: plan.ownerName!, email: plan.ownerEmail! } : null;
    this.trip.restoreStops(plan.stops, plan.id, plan.transits ?? [], owner);
    if (plan.stops.length > 0) this.trip.setActive(plan.stops[0].stopId);
    this.router.navigate(['/']);
  }

  goToAiPlan(): void {
    this.facade.openMyTrips('aiplans');
  }
}
