import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export interface VisitedPin {
  id: string;
  label: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top  (0-100)
}

const key = (email: string) => `tb_visited_${email}`;

@Injectable({ providedIn: 'root' })
export class VisitedPlacesService {
  private readonly auth = inject(AuthService);
  private _pins = signal<VisitedPin[]>([]);
  readonly pins = this._pins.asReadonly();

  constructor() {
    const user = this.auth.currentUser();
    if (user?.email) this.loadForUser(user.email);
  }

  loadForUser(email: string): void {
    try {
      const raw = localStorage.getItem(key(email));
      this._pins.set(raw ? (JSON.parse(raw) as VisitedPin[]) : []);
    } catch {
      this._pins.set([]);
    }
  }

  addPin(email: string, pin: Omit<VisitedPin, 'id'>): void {
    const next = [...this._pins(), { id: crypto.randomUUID(), ...pin }];
    this._pins.set(next);
    localStorage.setItem(key(email), JSON.stringify(next));
  }

  removePin(email: string, id: string): void {
    const next = this._pins().filter(p => p.id !== id);
    this._pins.set(next);
    localStorage.setItem(key(email), JSON.stringify(next));
  }

  clear(): void {
    this._pins.set([]);
  }
}
