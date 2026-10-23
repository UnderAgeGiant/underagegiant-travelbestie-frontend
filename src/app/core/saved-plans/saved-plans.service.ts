import { Injectable, signal, inject } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { TripStop, TransitLeg, PendingCollaboratorInvite, CostSettings, CostEstimate } from '../models/trip.model';
import { environment } from '../../../environments/environment';
import { TravelDocsReminderService } from '../reminders/travel-docs-reminder.service';

export interface SavedPlan {
  id:         string;
  name:       string;
  savedAt:    string;
  stops:      TripStop[];
  transits?:  TransitLeg[];
  shareId?:   string;
  exportedAt?: string;
  isCollaborator?: boolean;
  ownerName?:      string;
  ownerEmail?:     string;
  costSettings?:   CostSettings;
  costEstimate?:   CostEstimate | null;
}

const key = (email: string) => `tb_saved_plans_${email}`;

@Injectable({ providedIn: 'root' })
export class SavedPlansService {
  private readonly auth = inject(AuthService);
  private readonly api  = inject(ApiService);
  private readonly travelDocsReminder = inject(TravelDocsReminderService);
  private _plans = signal<SavedPlan[]>([]);
  readonly plans = this._plans.asReadonly();
  /** Trip ids with an estimate request in flight (true from subscribe until it answers or errors). */
  private _estimating = signal<ReadonlySet<string>>(new Set());
  readonly estimating = this._estimating.asReadonly();

  private _pendingInvites = signal<PendingCollaboratorInvite[]>([]);
  readonly pendingInvites = this._pendingInvites.asReadonly();

  loadPendingInvites(): void {
    if (environment.useMocks) { this._pendingInvites.set([]); return; }
    this.api.getPendingInvites().subscribe({
      next: invites => this._pendingInvites.set(invites),
      error: () => { /* non-fatal: keep the previous list */ },
    });
  }

  constructor() {
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  /** Email whose plans are loaded or loading. Guards the duplicate boot/login calls (see spec C1). */
  private loadedEmail: string | null = null;

  loadForUser(email: string, force = false): void {
    if (!force && this.loadedEmail === email) return;
    this.loadedEmail = email;
    if (environment.useMocks) {
      try {
        const raw = localStorage.getItem(key(email));
        this._plans.set(raw ? (JSON.parse(raw) as SavedPlan[]) : []);
      } catch {
        this._plans.set([]);
      }
      return;
    }
    this.api.getTrips().subscribe({
      next: trips => {
        this._plans.set(trips.map(t => ({
          id:       t.id!,
          name:     t.title,
          savedAt:  t.createdAt ?? new Date().toISOString(),
          stops:    t.stops,
          transits: t.transits ?? [],
          ...(t.shareId ? { shareId: t.shareId } : {}),
          ...(t.itineraryExportedAt ? { exportedAt: t.itineraryExportedAt } : {}),
          ...(t.isCollaborator ? { isCollaborator: true, ownerName: t.ownerName, ownerEmail: t.ownerEmail } : {}),
          ...(t.costSettings ? { costSettings: t.costSettings } : {}),
          ...(t.costEstimate !== undefined ? { costEstimate: t.costEstimate } : {}),
        })));
      },
      error: () => { this.loadedEmail = null; },
    });
  }

  /**
   * Create or update a plan. Returns the final id (server-assigned on create in real mode).
   * `opts.background` marks a silent autosave call (background timer tick, or the
   * logo-click/load-plan/new-trip autosave-before-navigating-away helper) — these
   * should never trigger the "on first save" travel-docs reminder, which is meant
   * to fire only after a deliberate, explicit user save (the "Guardar viaje" button,
   * or the AI-planning save flow).
   */
  upsert(
    email: string, id: string | null, name: string, stops: TripStop[], transits: TransitLeg[] = [],
    opts?: { background?: boolean; sourceAiPlanRequestId?: string; sourcePlanSessionId?: string; costSettings?: CostSettings },
  ): Observable<string> {
    const settingsPatch = opts?.costSettings ? { costSettings: opts.costSettings } : {};
    if (environment.useMocks) {
      const now = new Date().toISOString();
      if (id) {
        const updated = this._plans().map(p =>
          p.id === id ? { ...p, name, stops, transits, savedAt: now, ...settingsPatch } : p
        );
        this._plans.set(updated);
        localStorage.setItem(key(email), JSON.stringify(updated));
        if (!opts?.background) this.travelDocsReminder.maybeShow();
        return of(id);
      }
      const plan: SavedPlan = { id: crypto.randomUUID(), name, savedAt: now, stops, transits, ...settingsPatch };
      const updated = [...this._plans(), plan];
      this._plans.set(updated);
      localStorage.setItem(key(email), JSON.stringify(updated));
      if (!opts?.background) this.travelDocsReminder.maybeShow();
      return of(plan.id);
    }

    if (id) {
      return this.api.updateTrip(id, { title: name, stops, transits, ...settingsPatch }).pipe(
        tap(() => {
          const now = new Date().toISOString();
          this._plans.set(this._plans().map(p =>
            p.id === id ? { ...p, name, stops, transits, savedAt: now, ...settingsPatch } : p
          ));
          if (!opts?.background) {
            this.travelDocsReminder.maybeShow();
            this.estimate(id).subscribe({ error: () => { /* estimate failure never fails the save */ } });
          }
        }),
        map(() => id)
      );
    }
    return this.api.saveTrip({
      title: name, stops, transits,
      sourceAiPlanRequestId: opts?.sourceAiPlanRequestId,
      sourcePlanSessionId: opts?.sourcePlanSessionId,
      ...settingsPatch,
    }).pipe(
      tap(trip => {
        const plan: SavedPlan = {
          id:       trip.id!,
          name:     trip.title,
          savedAt:  trip.createdAt ?? new Date().toISOString(),
          stops:    trip.stops,
          transits: trip.transits ?? [],
          ...settingsPatch,
        };
        this._plans.set([...this._plans(), plan]);
        if (!opts?.background) {
          this.travelDocsReminder.maybeShow();
          this.estimate(trip.id!).subscribe({ error: () => { /* estimate failure never fails the save */ } });
        }
      }),
      map(trip => trip.id!)
    );
  }

  /** Calculates the trip's cost estimate on the server and stores it on the local plan. */
  estimate(id: string): Observable<CostEstimate> {
    return defer(() => {
      this._estimating.set(new Set([...this._estimating(), id]));
      return this.api.estimateTrip(id).pipe(
        tap(costEstimate => this._plans.set(this._plans().map(p => p.id === id ? { ...p, costEstimate } : p))),
        finalize(() => this._estimating.set(new Set([...this._estimating()].filter(x => x !== id)))),
      );
    });
  }

  markExported(email: string, planId: string): void {
    const now = new Date().toISOString();
    const updated = this._plans().map(p => p.id === planId ? { ...p, exportedAt: now } : p);
    this._plans.set(updated);
    if (environment.useMocks) {
      localStorage.setItem(key(email), JSON.stringify(updated));
    }
  }

  setShareId(email: string, planId: string, shareId: string): void {
    const updated = this._plans().map(p => p.id === planId ? { ...p, shareId } : p);
    this._plans.set(updated);
    if (environment.useMocks) {
      localStorage.setItem(key(email), JSON.stringify(updated));
    }
  }

  remove(email: string, id: string): void {
    // Optimistic: update local state immediately, then fire the API call
    this._plans.set(this._plans().filter(p => p.id !== id));
    if (environment.useMocks) {
      const updated = this._plans();
      localStorage.setItem(key(email), JSON.stringify(updated));
      return;
    }
    this.api.deleteTrip(id).subscribe();
  }

  /** Register a trip that already exists on the server into the local plans list. */
  register(plan: SavedPlan): void {
    if (this._plans().some(p => p.id === plan.id)) return;
    this._plans.set([...this._plans(), plan]);
  }

  clear(): void {
    this.loadedEmail = null;
    this._plans.set([]);
    this._pendingInvites.set([]);
  }
}
