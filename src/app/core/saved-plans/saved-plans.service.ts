import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { TripStop } from '../models/trip.model';

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: string;
  stops: TripStop[];
}

const key = (email: string) => `tb_saved_plans_${email}`;

@Injectable({ providedIn: 'root' })
export class SavedPlansService {
  private readonly auth = inject(AuthService);
  private _plans = signal<SavedPlan[]>([]);
  readonly plans = this._plans.asReadonly();

  constructor() {
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  loadForUser(email: string): void {
    try {
      const raw = localStorage.getItem(key(email));
      this._plans.set(raw ? (JSON.parse(raw) as SavedPlan[]) : []);
    } catch {
      this._plans.set([]);
    }
  }

  /** Create a new plan or update an existing one in-place. Returns the final id. */
  upsert(email: string, id: string | null, name: string, stops: TripStop[]): string {
    const now = new Date().toISOString();
    if (id) {
      const updated = this._plans().map(p =>
        p.id === id ? { ...p, name, stops, savedAt: now } : p
      );
      this._plans.set(updated);
      localStorage.setItem(key(email), JSON.stringify(updated));
      return id;
    }
    const plan: SavedPlan = { id: crypto.randomUUID(), name, savedAt: now, stops };
    const updated = [...this._plans(), plan];
    this._plans.set(updated);
    localStorage.setItem(key(email), JSON.stringify(updated));
    return plan.id;
  }

  remove(email: string, id: string): void {
    const updated = this._plans().filter(p => p.id !== id);
    this._plans.set(updated);
    localStorage.setItem(key(email), JSON.stringify(updated));
  }

  clear(): void {
    this._plans.set([]);
  }
}
