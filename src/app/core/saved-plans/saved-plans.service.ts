import { Injectable, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { TripStop, TransitLeg, PendingCollaboratorInvite } from '../models/trip.model';
import { environment } from '../../../environments/environment';

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
}

const key = (email: string) => `tb_saved_plans_${email}`;

@Injectable({ providedIn: 'root' })
export class SavedPlansService {
  private readonly auth = inject(AuthService);
  private readonly api  = inject(ApiService);
  private _plans = signal<SavedPlan[]>([]);
  readonly plans = this._plans.asReadonly();

  private _pendingInvites = signal<PendingCollaboratorInvite[]>([]);
  readonly pendingInvites = this._pendingInvites.asReadonly();

  loadPendingInvites(): void {
    if (environment.useMocks) { this._pendingInvites.set([]); return; }
    this.api.getPendingInvites().subscribe(invites => this._pendingInvites.set(invites));
  }

  constructor() {
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  loadForUser(email: string): void {
    if (environment.useMocks) {
      try {
        const raw = localStorage.getItem(key(email));
        this._plans.set(raw ? (JSON.parse(raw) as SavedPlan[]) : []);
      } catch {
        this._plans.set([]);
      }
      return;
    }
    this.api.getTrips().subscribe(trips => {
      this._plans.set(trips.map(t => ({
        id:       t.id!,
        name:     t.title,
        savedAt:  t.createdAt ?? new Date().toISOString(),
        stops:    t.stops,
        transits: t.transits ?? [],
        ...(t.shareId ? { shareId: t.shareId } : {}),
        ...(t.itineraryExportedAt ? { exportedAt: t.itineraryExportedAt } : {}),
        ...(t.isCollaborator ? { isCollaborator: true, ownerName: t.ownerName, ownerEmail: t.ownerEmail } : {}),
      })));
    });
    this.loadPendingInvites();
  }

  /** Create or update a plan. Returns the final id (server-assigned on create in real mode). */
  upsert(email: string, id: string | null, name: string, stops: TripStop[], transits: TransitLeg[] = []): Observable<string> {
    if (environment.useMocks) {
      const now = new Date().toISOString();
      if (id) {
        const updated = this._plans().map(p =>
          p.id === id ? { ...p, name, stops, transits, savedAt: now } : p
        );
        this._plans.set(updated);
        localStorage.setItem(key(email), JSON.stringify(updated));
        return of(id);
      }
      const plan: SavedPlan = { id: crypto.randomUUID(), name, savedAt: now, stops, transits };
      const updated = [...this._plans(), plan];
      this._plans.set(updated);
      localStorage.setItem(key(email), JSON.stringify(updated));
      return of(plan.id);
    }

    if (id) {
      return this.api.updateTrip(id, { title: name, stops, transits }).pipe(
        tap(() => {
          const now = new Date().toISOString();
          this._plans.set(this._plans().map(p =>
            p.id === id ? { ...p, name, stops, transits, savedAt: now } : p
          ));
        }),
        map(() => id)
      );
    }
    return this.api.saveTrip({ title: name, stops, transits }).pipe(
      tap(trip => {
        const plan: SavedPlan = {
          id:       trip.id!,
          name:     trip.title,
          savedAt:  trip.createdAt ?? new Date().toISOString(),
          stops:    trip.stops,
          transits: trip.transits ?? [],
        };
        this._plans.set([...this._plans(), plan]);
      }),
      map(trip => trip.id!)
    );
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
    this._plans.set([]);
    this._pendingInvites.set([]);
  }
}
